import Link from "next/link";
import { ShoppingBag, Store, LayoutGrid } from "lucide-react";

type CatalogueEmptyStateProps = {
  hasCategory: boolean;
  hasStore: boolean;
  categories?: { name: string; slug: string }[];
};

export function CatalogueEmptyState({
  hasCategory,
  hasStore,
  categories = [],
}: CatalogueEmptyStateProps) {
  if (!hasStore) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-aurora-surface-hover flex items-center justify-center mb-6 ring-4 ring-aurora-primary/10">
          <Store className="w-10 h-10 text-aurora-primary" />
        </div>
        <h2 className="text-xl font-bold text-aurora-text mb-2">Select a store to browse</h2>
        <p className="text-aurora-muted mb-8">
          Choose your local store to see products and start shopping.
        </p>
        <Link
          href="/stores"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
        >
          <Store className="w-5 h-5" />
          Find your store
        </Link>
      </div>
    );
  }

  if (hasCategory) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-aurora-surface-hover flex items-center justify-center mb-6 ring-4 ring-aurora-primary/10">
          <LayoutGrid className="w-10 h-10 text-aurora-primary" />
        </div>
        <h2 className="text-xl font-bold text-aurora-text mb-2">No products in this category yet</h2>
        <p className="text-aurora-muted mb-8">
          This category is empty. Try another category or browse all products.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
          >
            <LayoutGrid className="w-5 h-5" />
            View all products
          </Link>
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalogue?category=${cat.slug}`}
              className="inline-flex items-center h-12 px-5 rounded-xl border-2 border-aurora-border text-aurora-text font-medium hover:border-aurora-primary hover:text-aurora-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-aurora-surface-hover flex items-center justify-center mb-6 ring-4 ring-aurora-primary/10">
        <ShoppingBag className="w-10 h-10 text-aurora-primary" />
      </div>
      <h2 className="text-xl font-bold text-aurora-text mb-2">No products yet</h2>
      <p className="text-aurora-muted mb-8">
        Products will appear here once they&apos;re added. Check back soon or browse our categories.
      </p>
      <Link
        href="/catalogue"
        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
      >
        <ShoppingBag className="w-5 h-5" />
        Browse catalogue
      </Link>
    </div>
  );
}
