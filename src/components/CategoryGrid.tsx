import Link from "next/link";
import { categories } from "@/lib/data";
import { categoryIcons } from "@/lib/icons";

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {categories.map((category) => {
        const Icon = categoryIcons[category.id];
        return (
          <Link
            key={category.id}
            href={`/elonlar?category=${category.id}`}
            className="card-hover group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-5 text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-brand-via transition-colors group-hover:text-brand-to">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted group-hover:text-foreground">
              {category.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
