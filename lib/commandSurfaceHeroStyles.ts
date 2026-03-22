/** Tailwind class strings for tenant-controlled home hero (storefrontHero.size / layout). */

export type HeroSize = "compact" | "default" | "tall";

export function splitHeroImageClampClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "max-h-[clamp(6rem,36vw,11rem)] sm:max-h-[clamp(8rem,34vw,14rem)] md:max-h-[clamp(9rem,32vw,16rem)] lg:max-h-[clamp(11rem,50vh,18rem)]";
    case "tall":
      return "max-h-[clamp(9rem,44vw,14rem)] sm:max-h-[clamp(12rem,42vw,18rem)] md:max-h-[clamp(14rem,40vw,22rem)] lg:max-h-[clamp(18rem,58vh,28rem)] xl:max-h-[clamp(20rem,60vh,32rem)]";
    default:
      return "max-h-[clamp(7rem,40vw,12rem)] sm:max-h-[clamp(9rem,38vw,15rem)] md:max-h-[clamp(11rem,36vw,18rem)] lg:max-h-[clamp(14rem,55vh,24rem)] xl:max-h-[clamp(16rem,58vh,28rem)] 2xl:max-h-[clamp(18rem,60vh,32rem)]";
  }
}

/** Fixed viewport-relative height for full-width hero band. */
export function fullWidthHeroBandClass(size: HeroSize): string {
  switch (size) {
    case "compact":
      return "h-[min(38vw,260px)] sm:h-[min(34vw,300px)]";
    case "tall":
      return "h-[min(52vw,480px)] sm:h-[min(48vw,540px)]";
    default:
      return "h-[min(44vw,360px)] sm:h-[min(40vw,420px)]";
  }
}
