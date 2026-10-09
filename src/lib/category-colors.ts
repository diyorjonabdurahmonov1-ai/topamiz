import type { CategoryId } from "./types";

// Each lost-and-found category's gradient — on cards, map pins and the post
// form's category tiles. Listings don't store a colour pair: it's derived
// from the category, so it stays consistent site-wide. Kept free of server imports so client components
// can use it too.
export const CATEGORY_COLORS: Record<CategoryId, { from: string; to: string }> = {
  hujjatlar: { from: "#6366f1", to: "#22d3ee" },
  texnika: { from: "#0ea5e9", to: "#22d3ee" },
  sumka: { from: "#a855f7", to: "#6366f1" },
  hayvonlar: { from: "#f59e0b", to: "#f97316" },
  kalitlar: { from: "#22c55e", to: "#16a34a" },
  kiyim: { from: "#0ea5e9", to: "#6366f1" },
  boshqa: { from: "#eab308", to: "#f59e0b" },
};
