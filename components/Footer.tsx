import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Hippo Ecom";
const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "/hippo-logo.png";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            {logoUrl ? (
              <Link href="/" className="inline-block mb-3">
                <img
                  src={logoUrl}
                  alt=""
                  className="h-14 w-auto object-contain"
                />
              </Link>
            ) : null}
            <p className="text-lg font-semibold mb-2">{siteName}</p>
            <p className="text-aurora-muted text-sm">
              Your neighborhood online grocery store. Fresh produce, quality products, and convenient delivery.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Shop</h3>
            <ul className="space-y-2 text-sm text-aurora-muted">
              <li><Link href="/catalogue" className="hover:text-aurora-text transition-colors">Categories</Link></li>
              <li><Link href="/offers" className="hover:text-aurora-text transition-colors">Deals</Link></li>
              <li><Link href="/offers" className="hover:text-aurora-text transition-colors">Weekly Specials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-aurora-muted">
              <li><Link href="/account/orders" className="hover:text-aurora-text transition-colors">Orders</Link></li>
              <li><Link href="/account/addresses" className="hover:text-aurora-text transition-colors">Addresses</Link></li>
              <li><Link href="/account/payment-methods" className="hover:text-aurora-text transition-colors">Payment Methods</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Help</h3>
            <ul className="space-y-2 text-sm text-aurora-muted">
              <li><Link href="/about" className="hover:text-aurora-text transition-colors">Delivery</Link></li>
              <li><Link href="/about" className="hover:text-aurora-text transition-colors">Returns</Link></li>
              <li><Link href="/about" className="hover:text-aurora-text transition-colors">Support</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-aurora-muted">
              <li><Link href="/about" className="hover:text-aurora-text transition-colors">About Us</Link></li>
              <li><Link href="/about" className="hover:text-aurora-text transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-aurora-border flex flex-wrap gap-6 text-sm text-aurora-muted">
          <span className="flex items-center gap-1">Secure payments</span>
          <span className="flex items-center gap-1">Same-day delivery</span>
          <span className="flex items-center gap-1">Freshness guarantee</span>
        </div>
      </div>
    </footer>
  );
}
