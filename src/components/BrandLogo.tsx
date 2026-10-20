export const BRAND_LOGO_SRC = '/dwarika-logo-transparent.png?v=3';
export const BRAND_NAME = 'Dwarika Jewellers';

type BrandLogoProps = {
  size?: 'nav' | 'footer';
  className?: string;
};

/** Full logo (icon + DWARIKA JEWELLERS) with transparent background. */
export default function BrandLogo({ size = 'nav', className = '' }: BrandLogoProps) {
  const heightClass =
    size === 'footer' ? 'h-12 sm:h-[3.25rem]' : 'h-10 sm:h-11 md:h-12';

  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      className={`${heightClass} w-auto max-w-[min(100%,220px)] sm:max-w-[260px] md:max-w-[300px] object-contain object-left shrink-0 contrast-[1.08] brightness-[1.02] ${className}`}
      decoding="async"
      style={{ imageRendering: 'auto' }}
    />
  );
}
