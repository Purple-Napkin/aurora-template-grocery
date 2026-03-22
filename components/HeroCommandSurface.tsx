import { getStoreConfig } from "@aurora-studio/starter-core";
import { CommandSurface } from "./CommandSurface";

const DEFAULT_LOGO = "/hippo-logo.png";

type StoreConfig = {
  branding?: { logo_url?: string | null } | null;
  storefrontHero?: {
    image_url?: string | null;
    layout?: string;
    size?: string;
  } | null;
};

export async function HeroCommandSurface() {
  const envLogo = process.env.NEXT_PUBLIC_LOGO_URL ?? DEFAULT_LOGO;
  let config: StoreConfig | null = null;
  try {
    config = (await getStoreConfig()) as StoreConfig;
  } catch {
    config = null;
  }
  const sh = config?.storefrontHero;
  const brandingLogo = config?.branding?.logo_url?.trim() || null;
  const heroOverride = sh?.image_url?.trim() || null;
  const displayUrl = heroOverride || brandingLogo || envLogo;
  const layoutNorm =
    typeof sh?.layout === "string" ? sh.layout.trim().toLowerCase().replace(/-/g, "_") : "";
  const heroLayout = layoutNorm === "full_width" ? "full_width" : "split";
  const sizeNorm = typeof sh?.size === "string" ? sh.size.trim().toLowerCase() : "";
  const heroSize =
    sizeNorm === "compact" || sizeNorm === "tall" ? sizeNorm : "default";

  return (
    <CommandSurface
      heroImageUrl={displayUrl}
      heroLayout={heroLayout}
      heroSize={heroSize}
    />
  );
}
