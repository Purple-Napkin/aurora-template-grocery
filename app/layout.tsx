import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { AddToCartFlyProvider } from "@/components/AddToCartFly";
import { ConditionalHolmesScript } from "@/components/ConditionalHolmesScript";
import { StoreProvider } from "@/components/StoreContext";
import { AuthProvider } from "@/components/AuthProvider";
import { ConditionalLayout } from "@/components/ConditionalLayout";

const siteName =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "Hippo Ecom";

export const metadata: Metadata = {
  title: siteName,
  description: "Storefront powered by Aurora Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = process.env.NEXT_PUBLIC_THEME === "dark" ? "dark" : "light";
  return (
    <html lang="en" data-theme={theme}>
      <body
        className="min-h-screen bg-aurora-bg"
        style={
          {
            "--aurora-accent":
              process.env.NEXT_PUBLIC_ACCENT_COLOR ?? "#15803D",
            color: "var(--aurora-text)",
          } as React.CSSProperties
        }
      >
        <StoreProvider>
          <AuthProvider>
        <CartProvider>
          <AddToCartFlyProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AddToCartFlyProvider>
        </CartProvider>
          </AuthProvider>
        </StoreProvider>
        <Suspense fallback={null}>
          <ConditionalHolmesScript />
        </Suspense>
      </body>
    </html>
  );
}
