export interface HesabfaContactIdentity {
  code: string;
  mobile: string;
  hesabfaId: number | undefined;
}

export interface LocalContactIdentity {
  id: string;
  role: string;
  phoneNumber: string;
  hesabfaCode: string | null;
  hesabfaId: number | null;
}

export interface ContactIdRelease {
  userId: string;
  hesabfaId: number;
}

/**
 * Match Hesabfa persons to local wholesale accounts.
 *
 * A mobile shared by multiple incoming persons is ambiguous, so every person
 * with that mobile is ignored. Unknown, unambiguous persons are planned as new
 * wholesale accounts; this function never mutates data.
 */
export function planContactIdentitySync<T extends HesabfaContactIdentity>(
  contacts: readonly T[],
  users: readonly LocalContactIdentity[],
): {
  toUpdate: Array<{ id: string; contact: T }>;
  toCreate: T[];
  hesabfaIdsToRelease: ContactIdRelease[];
  skipped: number;
} {
  const mobileCounts = new Map<string, number>();
  for (const contact of contacts) {
    mobileCounts.set(contact.mobile, (mobileCounts.get(contact.mobile) ?? 0) + 1);
  }

  const byCode = new Map<string, LocalContactIdentity>();
  const byHesabfaId = new Map<number, LocalContactIdentity>();
  const byPhone = new Map<string, LocalContactIdentity>();
  for (const user of users) {
    if (user.hesabfaCode) byCode.set(user.hesabfaCode.trim(), user);
    if (user.hesabfaId != null) byHesabfaId.set(user.hesabfaId, user);
    byPhone.set(user.phoneNumber, user);
  }

  const toUpdate: Array<{ id: string; contact: T }> = [];
  const toCreate: T[] = [];
  const releases = new Map<number, ContactIdRelease>();
  const claimedUsers = new Set<string>();
  const claimedIncomingIds = new Set<number>();
  let skipped = 0;

  for (const contact of contacts) {
    if ((mobileCounts.get(contact.mobile) ?? 0) > 1) {
      skipped++;
      continue;
    }
    if (contact.hesabfaId != null) {
      if (claimedIncomingIds.has(contact.hesabfaId)) {
        skipped++;
        continue;
      }
      claimedIncomingIds.add(contact.hesabfaId);
    }

    const codeMatch = byCode.get(contact.code);
    const idMatch =
      contact.hesabfaId != null ? byHesabfaId.get(contact.hesabfaId) : undefined;
    const phoneMatch = byPhone.get(contact.mobile);
    const canonical = codeMatch ?? phoneMatch ?? idMatch;

    if (!canonical) {
      toCreate.push(contact);
      continue;
    }

    // Never take a phone from another local account or overwrite retail/admin users.
    if (
      canonical.role !== 'WHOLESALE' ||
      (phoneMatch && phoneMatch.id !== canonical.id) ||
      claimedUsers.has(canonical.id)
    ) {
      skipped++;
      continue;
    }

    claimedUsers.add(canonical.id);
    toUpdate.push({ id: canonical.id, contact });

    if (contact.hesabfaId != null && idMatch && idMatch.id !== canonical.id) {
      releases.set(contact.hesabfaId, {
        userId: idMatch.id,
        hesabfaId: contact.hesabfaId,
      });
    }
  }

  return {
    toUpdate,
    toCreate,
    hesabfaIdsToRelease: [...releases.values()],
    skipped,
  };
}
