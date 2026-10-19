import { db } from "./db";
import { nameKey } from "./name-key";

// Profile names are unique, Instagram-style: nobody can take a name someone
// else already has (see nameKey for what counts as the same). The database
// enforces it with a unique index on users.name_key; these helpers are how
// the app checks first, so the visitor gets a clear answer instead.

export const MAX_NAME_LENGTH = 80;
export const MIN_NAME_LENGTH = 2;
export const BRAND_NAME = "Findo";

export function isReservedName(name: string): boolean {
  return nameKey(name).replace(/\s/g, "") === BRAND_NAME.toLowerCase();
}

export function isNameTaken(name: string, exceptUserId?: number): boolean {
  const row = db
    .prepare("SELECT 1 FROM users WHERE name_key = ? AND id != ?")
    .get(nameKey(name), exceptUserId ?? 0);
  return !!row;
}

export type NameProblem = "nameRequired" | "nameReserved" | "nameTaken";

// `exceptUserId`: someone renaming themselves may keep their own name.
export function nameProblem(
  name: string,
  { exceptUserId, allowReserved = false }: { exceptUserId?: number; allowReserved?: boolean } = {}
): NameProblem | null {
  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH) return "nameRequired";
  if (!allowReserved && isReservedName(trimmed)) return "nameReserved";
  if (isNameTaken(trimmed, exceptUserId)) return "nameTaken";
  return null;
}

// For an account whose name nobody typed (Google sign-in hands us one):
// the name itself if it's free, otherwise the first free "Name 2", "Name 3"…
export function uniqueName(base: string): string {
  const name = base.trim().slice(0, MAX_NAME_LENGTH);
  if (!isNameTaken(name) && !isReservedName(name)) return name;
  for (let n = 2; ; n++) {
    const suffix = ` ${n}`;
    const candidate = `${name.slice(0, MAX_NAME_LENGTH - suffix.length)}${suffix}`;
    if (!isNameTaken(candidate)) return candidate;
  }
}

// A unique-index violation on name_key: someone took the name between the
// check and the insert.
export function isNameConflict(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed: users\.name_key/.test(err.message);
}
