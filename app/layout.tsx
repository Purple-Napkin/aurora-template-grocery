import type { Metadata } from "next";
import "@aurora-studio/starter-core/template-logo.css";
import "./globals.css";
import {
  ConditionalHolmesScript,
  getResolvedStorefrontAccentForLayout,
} from "@aurora-studio/starter-core";
import { ClientProviders } from "@/components/ClientProviders";

const siteName =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "Example Grocery";

const TEMPLATE_ACCENT_DEFAULT = "#1fa971";

export const metadata: Metadata = {
  title: siteName,
  description: "Storefront powered by Aurora Studio",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = process.env.NEXT_PUBLIC_THEME === "dark" ? "dark" : "light";
  const accent = await getResolvedStorefrontAccentForLayout(
    TEMPLATE_ACCENT_DEFAULT
  );
  return (
    <html lang="en" data-theme={theme}>
      <body
        className="min-h-screen bg-aurora-bg pb-28 sm:pb-32"
        style={
          {
            "--aurora-accent": accent,
            color: "var(--aurora-text)",
          } as React.CSSProperties
        }
      >
        <ClientProviders>{children}</ClientProviders>
        <ConditionalHolmesScript />
      </body>
    </html>
  );
}
