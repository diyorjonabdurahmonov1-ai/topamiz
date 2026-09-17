import type { Metadata } from "next";
import ListingsExplorer from "@/components/ListingsExplorer";
import type { CategoryId, ListingKind } from "@/lib/types";
import { categories } from "@/lib/data";

export const metadata: Metadata = {
  title: "E'lonlar — Topamiz",
};

const categoryIds = new Set(categories.map((c) => c.id));

export default async function ElonlarPage(props: PageProps<"/elonlar">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const kindRaw = typeof searchParams.kind === "string" ? searchParams.kind : "all";
  const kind = kindRaw === "lost" || kindRaw === "found" ? (kindRaw as ListingKind) : "all";
  const categoryRaw = typeof searchParams.category === "string" ? searchParams.category : "all";
  const category = categoryIds.has(categoryRaw as CategoryId)
    ? (categoryRaw as CategoryId)
    : "all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Yo'qolgan va topilgan <span className="gradient-text">e'lonlar</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Barcha e'lonlarni ko'ring, qidiring va filtrlang. Buyumingizni
          topganlarga yordam beruvchi AI yordamchidan foydalanishni ham
          unutmang.
        </p>
      </div>
      <ListingsExplorer initialQuery={q} initialKind={kind} initialCategory={category} />
    </div>
  );
}
