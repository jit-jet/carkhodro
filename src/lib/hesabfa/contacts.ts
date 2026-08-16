/**
 * Two-way contact sync: local WHOLESALE User ↔ Hesabfa Contact.
 * Hesabfa never creates website users; inbound changes only update an already
 * linked/matching wholesale account with a usable Mobile.
 */

import { prisma } from '@/src/lib/prisma';
import {
  getAllContacts,
  getContactByCode,
  getContactsById,
  isHesabfaConfigured,
  saveContact,
} from './client';
import { normalizeIranMobile } from './phone';
import {
  HESABFA_CONTACT_NODE_FAMILY,
  HESABFA_CONTACT_TYPE_CUSTOMER,
  HESABFA_TAG,
  type HesabfaContact,
} from './types';

export interface ContactSyncStats {
  created: number;
  updated: number;
  skipped: number;
  pushed: number;
}

const UPDATE_CONCURRENCY = 25;
const RETAIL_INVOICE_CONTACT_TAG = `${HESABFA_TAG}:retail-invoices`;
const contactPushes = new Map<string, Promise<void>>();
let retailInvoiceContactPromise: Promise<string | null> | null = null;

function codeOf(contact: HesabfaContact): string {
  return contact.Code != null ? String(contact.Code).trim() : '';
}

function displayName(contact: HesabfaContact): { firstName: string; lastName: string } {
  const first = contact.FirstName?.trim();
  const last = contact.LastName?.trim();
  if (first || last) {
    return { firstName: first || 'مشتری', lastName: last || 'حسابفا' };
  }
  const name = contact.Name?.trim() || 'مشتری حسابفا';
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '-' };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}

/** Run async work with a fixed concurrency limit. */
async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, concurrency);
  let next = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const idx = next++;
      await worker(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

interface CityLookup {
  /** `${provinceId}::${cityLower}` → cityId */
  byProvinceCity: Map<string, number>;
  /** cityLower → cityId (first match, same as findFirst) */
  byCity: Map<string, number>;
  /** provinceLower → provinceId */
  byProvince: Map<string, number>;
}

async function loadCityLookup(): Promise<CityLookup> {
  const [provinces, cities] = await Promise.all([
    prisma.province.findMany({ select: { id: true, name: true } }),
    prisma.city.findMany({ select: { id: true, name: true, provinceId: true } }),
  ]);

  const byProvince = new Map<string, number>();
  for (const p of provinces) {
    byProvince.set(p.name.trim().toLowerCase(), p.id);
  }

  const byProvinceCity = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const c of cities) {
    const cityKey = c.name.trim().toLowerCase();
    byProvinceCity.set(`${c.provinceId}::${cityKey}`, c.id);
    // Mirror findFirst: keep the first row encountered for bare city name.
    if (!byCity.has(cityKey)) byCity.set(cityKey, c.id);
  }

  return { byProvinceCity, byCity, byProvince };
}

function resolveCityId(
  state: string | null | undefined,
  city: string | null | undefined,
  lookup: CityLookup,
): number | null {
  const cityName = city?.trim();
  if (!cityName) return null;
  const cityKey = cityName.toLowerCase();

  const provinceName = state?.trim();
  if (provinceName) {
    const provinceId = lookup.byProvince.get(provinceName.toLowerCase());
    if (provinceId != null) {
      const match = lookup.byProvinceCity.get(`${provinceId}::${cityKey}`);
      if (match != null) return match;
    }
  }

  return lookup.byCity.get(cityKey) ?? null;
}

interface PreparedContact {
  code: string;
  mobile: string;
  firstName: string;
  lastName: string;
  hesabfaId: number | undefined;
  shopName: string | null;
  /** Explicit Active from Hesabfa; null when the API omitted it. */
  active: boolean | null;
  street: string | null;
  postalRaw: string;
  state: string | null | undefined;
  city: string | null | undefined;
}

function prepareContact(contact: HesabfaContact): PreparedContact | null {
  const code = codeOf(contact);
  const mobile = normalizeIranMobile(contact.Mobile);
  if (!code || !mobile) return null;

  const { firstName, lastName } = displayName(contact);
  return {
    code,
    mobile,
    firstName,
    lastName,
    hesabfaId: typeof contact.Id === 'number' ? contact.Id : undefined,
    shopName: contact.Company?.trim() || null,
    active: contact.Active === true ? true : contact.Active === false ? false : null,
    street: contact.Address?.trim() || null,
    postalRaw: contact.PostalCode?.replace(/\D/g, '') ?? '',
    state: contact.State,
    city: contact.City,
  };
}

async function upsertAddressesForUsers(
  rows: Array<{ userId: string; contact: PreparedContact }>,
  lookup: CityLookup,
): Promise<void> {
  const withStreet = rows.filter((r) => r.contact.street);
  if (withStreet.length === 0) return;

  const userIds = [...new Set(withStreet.map((r) => r.userId))];
  const existingAddresses = await prisma.address.findMany({
    where: { userId: { in: userIds } },
    orderBy: { isDefault: 'desc' },
    select: { id: true, userId: true },
  });
  // Prefer default address, same as findFirst({ orderBy: isDefault desc }).
  const addressByUser = new Map<string, string>();
  for (const a of existingAddresses) {
    if (!addressByUser.has(a.userId)) addressByUser.set(a.userId, a.id);
  }

  await mapPool(withStreet, UPDATE_CONCURRENCY, async ({ userId, contact }) => {
    const cityId = resolveCityId(contact.state, contact.city, lookup);
    if (cityId == null) return;

    const data = {
      cityId,
      street: contact.street!,
      postalCode: /^\d{10}$/.test(contact.postalRaw) ? contact.postalRaw : '0000000000',
      isDefault: true,
    };

    const existingId = addressByUser.get(userId);
    if (existingId) {
      await prisma.address.update({ where: { id: existingId }, data });
    } else {
      await prisma.address.create({ data: { userId, ...data } });
    }
  });
}

/** Import/update a batch of Hesabfa contacts into local users. */
export async function syncContactsFromHesabfa(
  contacts: HesabfaContact[],
): Promise<ContactSyncStats> {
  const stats: ContactSyncStats = { created: 0, updated: 0, skipped: 0, pushed: 0 };
  if (contacts.length === 0) return stats;

  // 1) Normalize in input order (skip invalid). Dedupe by code — last wins.
  const prepared = new Map<string, PreparedContact>();
  for (const contact of contacts) {
    const row = prepareContact(contact);
    if (!row) {
      stats.skipped++;
      continue;
    }
    prepared.set(row.code, row);
  }
  if (prepared.size === 0) return stats;

  const list = [...prepared.values()];
  const codes = list.map((c) => c.code);
  const mobiles = list.map((c) => c.mobile);
  const hesabfaIds = list
    .map((c) => c.hesabfaId)
    .filter((id): id is number => id != null);

  // 2) Prefetch every possible match. Only one unambiguous WHOLESALE match may
  // be updated; unknown contacts and RETAIL users are deliberately ignored.
  const existingRows = await prisma.user.findMany({
    where: {
      OR: [
        { hesabfaCode: { in: codes } },
        { phoneNumber: { in: mobiles } },
        ...(hesabfaIds.length > 0 ? [{ hesabfaId: { in: hesabfaIds } }] : []),
      ],
    },
    select: { id: true, role: true, hesabfaCode: true, hesabfaId: true, phoneNumber: true },
  });

  const byCode = new Map<string, string>();
  const byHesabfaId = new Map<number, string>();
  const byPhone = new Map<string, string>();
  const byId = new Map(existingRows.map((row) => [row.id, row]));
  for (const row of existingRows) {
    if (row.hesabfaCode) byCode.set(row.hesabfaCode, row.id);
    if (row.hesabfaId != null) byHesabfaId.set(row.hesabfaId, row.id);
    byPhone.set(row.phoneNumber, row.id);
  }

  function resolveExistingId(c: PreparedContact): string | null {
    const matches = new Set<string>();
    const codeMatch = byCode.get(c.code);
    const idMatch = c.hesabfaId != null ? byHesabfaId.get(c.hesabfaId) : undefined;
    const phoneMatch = byPhone.get(c.mobile);
    if (codeMatch) matches.add(codeMatch);
    if (idMatch) matches.add(idMatch);
    if (phoneMatch) matches.add(phoneMatch);
    if (matches.size !== 1) return null;

    const id = [...matches][0]!;
    return byId.get(id)?.role === 'WHOLESALE' ? id : null;
  }

  const toUpdate = new Map<string, PreparedContact>(); // last wins per user

  for (const contact of list) {
    const existingId = resolveExistingId(contact);
    if (existingId) {
      toUpdate.set(existingId, contact);
      continue;
    }
    stats.skipped++;
  }

  const now = new Date();
  const cityLookup = await loadCityLookup();

  // 3) Concurrent updates.
  const updateRows = [...toUpdate.entries()].map(([id, contact]) => ({ id, contact }));
  await mapPool(updateRows, UPDATE_CONCURRENCY, async ({ id, contact }) => {
    await prisma.user.update({
      where: { id },
      data: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumber: contact.mobile,
        shopName: contact.shopName,
        hesabfaCode: contact.code,
        ...(contact.hesabfaId != null ? { hesabfaId: contact.hesabfaId } : {}),
        hesabfaSyncedAt: now,
        ...(contact.active === false ? { isActive: false } : {}),
        ...(contact.active === true ? { isActive: true } : {}),
      },
    });
  });
  stats.updated = updateRows.length;

  // 4) Addresses for updated users (same rules as before).
  await upsertAddressesForUsers(
    updateRows.map(({ id, contact }) => ({ userId: id, contact })),
    cityLookup,
  );

  return stats;
}

export async function syncContactsByIds(ids: number[]): Promise<ContactSyncStats> {
  const contacts = await getContactsById(ids);
  return syncContactsFromHesabfa(contacts);
}

/**
 * Webhook helper: fetch contacts by Hesabfa numeric Ids, falling back to
 * codes from the hook `Extra` field when getById returns nothing.
 */
export async function syncContactsFromWebhook(
  ids: number[],
  extraCodes: string[] = [],
): Promise<ContactSyncStats> {
  let contacts = ids.length > 0 ? await getContactsById(ids) : [];

  if (contacts.length === 0 && extraCodes.length > 0) {
    const byCode: HesabfaContact[] = [];
    for (const code of extraCodes) {
      const row = await getContactByCode(code);
      if (row) byCode.push(row);
    }
    contacts = byCode;
  }

  const stats = await syncContactsFromHesabfa(contacts);
  const returnedIds = new Set(
    contacts
      .map((contact) => contact.Id)
      .filter((id): id is number => typeof id === 'number'),
  );
  stats.skipped += ids.filter((id) => !returnedIds.has(id)).length;
  return stats;
}

export async function fullSyncContacts(): Promise<ContactSyncStats> {
  const contacts = await getAllContacts();
  return syncContactsFromHesabfa(contacts);
}

/** Soft-deactivate local users whose Hesabfa contacts were deleted. */
export async function deactivateUsersByHesabfaIds(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { count } = await prisma.user.updateMany({
    where: { hesabfaId: { in: ids }, role: 'WHOLESALE' },
    data: { isActive: false, hesabfaSyncedAt: new Date() },
  });
  return count;
}

async function buildContactPayload(userId: string): Promise<Record<string, unknown> | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        orderBy: { isDefault: 'desc' },
        take: 1,
        include: { city: { include: { province: true } } },
      },
    },
  });
  if (!user) return null;
  if (user.role !== 'WHOLESALE') return null;

  const mobile = normalizeIranMobile(user.phoneNumber);
  if (!mobile) return null;

  const address = user.addresses[0];
  const name = `${user.firstName} ${user.lastName}`.trim();

  return {
    ...(user.hesabfaCode ? { code: user.hesabfaCode } : {}),
    name,
    firstName: user.firstName,
    lastName: user.lastName,
    company: user.shopName ?? '',
    contactType: HESABFA_CONTACT_TYPE_CUSTOMER,
    mobile,
    address: address?.street ?? '',
    city: address?.city.name ?? '',
    state: address?.city.province.name ?? '',
    postalCode: address?.postalCode ?? '',
    active: user.isActive,
    nodeFamily: HESABFA_CONTACT_NODE_FAMILY,
    tag: HESABFA_TAG,
  };
}

async function pushContactToHesabfaUnlocked(userId: string): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const originalPayload = await buildContactPayload(userId);
  if (!originalPayload) return;

  const payload = { ...originalPayload };
  if (!payload.code) {
    const mobile = normalizeIranMobile(String(payload.mobile ?? ''));
    if (!mobile) return;

    const matches = (await getAllContacts()).filter(
      (contact) => normalizeIranMobile(contact.Mobile) === mobile && codeOf(contact),
    );
    const codes = matches.map(codeOf);
    if (codes.length > 0) {
      const claimed = await prisma.user.findMany({
        where: { hesabfaCode: { in: codes }, id: { not: userId } },
        select: { hesabfaCode: true },
      });
      const claimedCodes = new Set(
        claimed.map((row) => row.hesabfaCode).filter((code): code is string => Boolean(code)),
      );
      const reusable = matches.find((contact) => !claimedCodes.has(codeOf(contact)));
      if (!reusable) {
        throw new Error(`Hesabfa contact conflict for wholesale user ${userId}`);
      }
      payload.code = codeOf(reusable);
    }
  }

  const saved = await saveContact(payload);
  const code = codeOf(saved);
  if (!code) return;

  await prisma.user.update({
    where: { id: userId, role: 'WHOLESALE' },
    data: {
      hesabfaCode: code,
      hesabfaId: typeof saved.Id === 'number' ? saved.Id : undefined,
      hesabfaSyncedAt: new Date(),
    },
  });
}

/** Create or update the Hesabfa contact for a wholesale local user. */
export async function pushContactToHesabfa(userId: string): Promise<void> {
  const active = contactPushes.get(userId);
  if (active) return active;

  const pending = pushContactToHesabfaUnlocked(userId);
  contactPushes.set(userId, pending);
  try {
    await pending;
  } finally {
    if (contactPushes.get(userId) === pending) contactPushes.delete(userId);
  }
}

async function resolveRetailInvoiceContactCode(): Promise<string | null> {
  if (!(await isHesabfaConfigured())) return null;

  const existing = (await getAllContacts()).find(
    (contact) => contact.Tag?.trim() === RETAIL_INVOICE_CONTACT_TAG && codeOf(contact),
  );
  if (existing) return codeOf(existing);

  const saved = await saveContact({
    name: 'مشتری فروش آنلاین',
    contactType: HESABFA_CONTACT_TYPE_CUSTOMER,
    isCustomer: true,
    active: true,
    nodeFamily: HESABFA_CONTACT_NODE_FAMILY,
    tag: RETAIL_INVOICE_CONTACT_TAG,
  });
  return codeOf(saved) || null;
}

/** Shared, non-user contact used only to keep RETAIL invoice export working. */
export async function getRetailInvoiceContactCode(): Promise<string | null> {
  if (retailInvoiceContactPromise) return retailInvoiceContactPromise;
  retailInvoiceContactPromise = resolveRetailInvoiceContactCode();
  try {
    return await retailInvoiceContactPromise;
  } finally {
    retailInvoiceContactPromise = null;
  }
}


