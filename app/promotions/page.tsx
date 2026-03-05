import { redirect } from "next/navigation";

/**
 * Legacy route: /promotions redirects to /offers.
 * Schema-v2 uses "Offers" instead of "Promotions".
 */
export default function PromotionsPage() {
  redirect("/offers");
}
