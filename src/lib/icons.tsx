import {
  IdCard,
  Smartphone,
  Briefcase,
  PawPrint,
  KeyRound,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "./types";

export const categoryIcons: Record<CategoryId, LucideIcon> = {
  hujjatlar: IdCard,
  texnika: Smartphone,
  sumka: Briefcase,
  hayvonlar: PawPrint,
  kalitlar: KeyRound,
  kiyim: Shirt,
  boshqa: Sparkles,
};
