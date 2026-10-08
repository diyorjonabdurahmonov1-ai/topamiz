import { AlertTriangle, Eye, Lock, MapPin, ShieldCheck, Wallet } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { LegalContent } from "./types";
import en from "./en";
import kk from "./kk";
import ky from "./ky";
import ru from "./ru";
import tg from "./tg";
import uz from "./uz";

// The texts of the legal pages in every site language, shared by the pages
// themselves and the reader the sign-up form opens, so both always show the
// same wording.
const CONTENT: Record<Locale, LegalContent> = { uz, ru, en, kk, ky, tg };

export function getLegal(locale: Locale): LegalContent {
  return CONTENT[locale] ?? uz;
}

// Pairs with LegalContent.safety.rules by index.
export const SAFETY_ICONS = [MapPin, Eye, Wallet, Lock, AlertTriangle, ShieldCheck];

export type { LegalContent, LegalDoc, LegalSection } from "./types";
