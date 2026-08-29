import type { HesabfaContact } from './types';

export function displayName(contact: HesabfaContact): { firstName: string; lastName: string } {
  const first = contact.FirstName?.trim() || '';
  const last = contact.LastName?.trim() || '';
  if (first || last) return { firstName: first, lastName: last };

  const name = contact.Name?.trim() || '';
  if (!name) return { firstName: '', lastName: '' };

  const parts = name.split(/\s+/);
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(' '),
  };
}
