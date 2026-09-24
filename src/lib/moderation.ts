import { blockUser } from "./admin-users";
import { db } from "./db";

// A plain keyword-based filter, not an exhaustive one — it catches the
// common, obvious cases across profanity, violence, and explicit sexual
// content in Uzbek, Russian, and English. Extend this list as real cases
// show up; it's deliberately simple rather than trying to be complete.
const BANNED_TERMS: string[] = [
  // profanity / insults
  "jalab", "qotoq", "suka", "blyad", "pidor", "chmo",
  "fuck", "bitch", "asshole", "bastard",
  // violence
  "qotillik qilaman", "o'ldiraman seni", "bomba yasash", "terrorizm",
  "ubiyu tebya", "vzorvu",
  "kill you", "bomb making instructions",
  // explicit sexual content
  "porno", "porn video", "intim xizmat", "prostitutka", "escort xizmat",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’ʻ]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findProhibitedTerm(text: string): string | null {
  const normalized = normalize(text);
  for (const term of BANNED_TERMS) {
    if (normalized.includes(normalize(term))) return term;
  }
  return null;
}

export function containsProhibitedContent(text: string): boolean {
  return findProhibitedTerm(text) !== null;
}

// After this many rejected submissions, the account is blocked outright
// instead of just warned again.
const BLOCK_AFTER_STRIKES = 2;

export interface ModerationViolation {
  strikes: number;
  blocked: boolean;
}

export function recordModerationViolation(userId: number): ModerationViolation {
  db.prepare("UPDATE users SET moderation_strikes = moderation_strikes + 1 WHERE id = ?").run(userId);
  const row = db.prepare("SELECT moderation_strikes FROM users WHERE id = ?").get(userId) as {
    moderation_strikes: number;
  };
  const strikes = row.moderation_strikes;
  const blocked = strikes >= BLOCK_AFTER_STRIKES && blockUser(userId);
  return { strikes, blocked };
}
