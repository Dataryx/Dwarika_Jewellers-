type BrandWordmarkProps = {
  size?: 'nav' | 'footer';
  className?: string;
};

const BRAND_MAROON = '#600018';

export default function BrandWordmark({ size = 'nav', className = '' }: BrandWordmarkProps) {
  const isNav = size === 'nav';

  return (
    <div className={`flex flex-col leading-none min-w-0 ${className}`}>
      <span
        className={`font-serif font-medium tracking-[0.06em] ${
          isNav ? 'text-[1.05rem] sm:text-[1.35rem]' : 'text-xl'
        }`}
        style={{ color: BRAND_MAROON }}
      >
        DWARIKA
      </span>
      <span
        className={`font-sans font-normal uppercase ${
          isNav
            ? 'text-[0.5rem] sm:text-[0.55rem] tracking-[0.38em] mt-1'
            : 'text-[0.6rem] tracking-[0.42em] mt-1.5'
        }`}
        style={{ color: BRAND_MAROON }}
      >
        Jewellers
      </span>
    </div>
  );
}
