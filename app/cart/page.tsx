import { StoreContentRails } from "@/components/StoreContentRails";
import CartPageClient from "./CartPageClient";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <StoreContentRails contentPage="cart" contentRegion="cart_above_lines" />
      </div>
      <CartPageClient />
    </>
  );
}
