/** Tailwind class strings for tenant-controlled home hero (storefrontHero.size / layout). */

export type HeroSize = "compact" | "default" | "tall";

export function splitHeroImageClampClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "max-h-[min(7.5rem,42vw)] sm:max-h-[min(8rem,34vw)] md:max-h-[min(8.5rem,28vw)] lg:max-h-36 xl:max-h-40";
    case "tall":
      return "max-h-[clamp(9rem,44vw,14rem)] sm:max-h-[clamp(12rem,42vw,18rem)] md:max-h-[clamp(14rem,40vw,22rem)] lg:max-h-[clamp(18rem,58vh,28rem)] xl:max-h-[clamp(20rem,60vh,32rem)]";
    default:
      return "max-h-[clamp(7rem,40vw,12rem)] sm:max-h-[clamp(9rem,38vw,15rem)] md:max-h-[clamp(11rem,36vw,18rem)] lg:max-h-[clamp(14rem,55vh,24rem)] xl:max-h-[clamp(16rem,58vh,28rem)] 2xl:max-h-[clamp(18rem,60vh,32rem)]";
  }
}

/** Split layout: logo well max-width + padding (compact = tight card, not full half-column). */
export function splitHeroLogoWellSizingClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "max-w-[min(85vw,260px)] lg:max-w-[11rem] p-3 sm:p-4";
    case "tall":
      return "max-w-[min(85vw,380px)] lg:max-w-full p-5 sm:p-8";
    default:
      return "max-w-[min(85vw,320px)] lg:max-w-full p-4 sm:p-6";
  }
}

export function splitHeroSectionPaddingClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "py-6 sm:py-8 lg:py-10";
    case "tall":
      return "py-14 sm:py-16 lg:py-24";
    default:
      return "py-12 sm:py-16 lg:py-20";
  }
}

export function splitHeroRowGapClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "gap-6 lg:gap-8 xl:gap-10";
    case "tall":
      return "gap-12 lg:gap-14 xl:gap-16";
    default:
      return "gap-10 lg:gap-12 xl:gap-16";
  }
}

export function splitHeroFallbackTitleClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-aurora-text";
    case "tall":
      return "font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-aurora-text";
    default:
      return "font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-aurora-text";
  }
}

/** Fixed viewport-relative height for full-width hero band. */
export function fullWidthHeroBandClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "h-[min(32vw,200px)] sm:h-[min(28vw,240px)]";
    case "tall":
      return "h-[min(52vw,480px)] sm:h-[min(48vw,540px)]";
    default:
      return "h-[min(44vw,360px)] sm:h-[min(40vw,420px)]";
  }
}
