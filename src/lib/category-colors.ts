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
  transport: { from: "#ef4444", to: "#f97316" },
  kochmas_mulk: { from: "#14b8a6", to: "#0ea5e9" },
  uy_rozgor: { from: "#8b5cf6", to: "#ec4899" },
  bolalar: { from: "#f472b6", to: "#fb923c" },
  sport: { from: "#22c55e", to: "#84cc16" },
  ish: { from: "#2563eb", to: "#7c3aed" },
  xizmatlar: { from: "#0891b2", to: "#22c55e" },
};
