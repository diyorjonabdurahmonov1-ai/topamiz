import {
  IdCard,
  Smartphone,
  Briefcase,
  PawPrint,
  KeyRound,
  Shirt,
  Sparkles,
  ShoppingBasket,
  UtensilsCrossed,
  Scissors,
  Wrench,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId, PromoCategoryId } from "./types";

export const categoryIcons: Record<CategoryId, LucideIcon> = {
  hujjatlar: IdCard,
  texnika: Smartphone,
  sumka: Briefcase,
  hayvonlar: PawPrint,
  kalitlar: KeyRound,
  kiyim: Shirt,
  boshqa: Sparkles,
};

export const promoCategoryIcons: Record<PromoCategoryId, LucideIcon> = {
  oziq_ovqat: ShoppingBasket,
  kafe_restoran: UtensilsCrossed,
  kiyim_poyabzal: Shirt,
  gozallik: Scissors,
  texnika_dokon: Smartphone,
  xizmatlar: Wrench,
  boshqa: Tag,
};
