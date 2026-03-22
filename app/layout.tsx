import type { Metadata } from "next";
import "./globals.css";
import { ConditionalHolmesScript } from "@aurora-studio/starter-core";
import { ClientProviders } from "@/components/ClientProviders";

const siteName =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "Example Grocery";

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
        className="min-h-screen bg-aurora-bg pb-28 sm:pb-32"
        style={
          {
            "--aurora-accent":
              process.env.NEXT_PUBLIC_ACCENT_COLOR ?? "#15803D",
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
