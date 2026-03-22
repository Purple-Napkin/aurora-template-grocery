/** Tailwind class strings for tenant-controlled home hero (storefrontHero.size / layout). */

export type HeroSize = "compact" | "default" | "tall";

export function splitHeroImageClampClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "max-h-[min(7.5rem,42vw)] sm:max-h-[min(8rem,34vw)] md:max-h-[min(8.5rem,28vw)] lg:max-h-36 xl:max-h-40";
    case "tall":
      return "max-h-[min(9rem,44vw)] sm:max-h-[min(11rem,40vw)] md:max-h-[min(13rem,36vw)] lg:max-h-72 xl:max-h-80 2xl:max-h-[22rem]";
    default:
      return "max-h-[min(7rem,40vw)] sm:max-h-[min(8.5rem,36vw)] md:max-h-[min(10rem,32vw)] lg:max-h-52 xl:max-h-56 2xl:max-h-60";
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
      return "py-5 sm:py-6 lg:py-8";
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
      return "font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-aurora-text text-center";
    case "tall":
      return "font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-aurora-text text-center";
    default:
      return "font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-aurora-text text-center";
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
