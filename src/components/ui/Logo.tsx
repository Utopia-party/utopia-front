import logoImage from '../../assets/logo.png';
import type { SizeType } from '../../types/size';

interface LogoProps {
  size?: SizeType;
  className?: string;
}

const SIZES: Record<SizeType, string> = {
  xs: 'w-[32px]',
  sm: 'w-[48px]',
  md: 'w-[64px]',
  lg: 'w-[96px]',
  xlg: 'w-[128px]',
};

export default function Logo({ size = 'md', className }: LogoProps) {
  return (
    <img
      src={logoImage}
      alt="Party-Up"
      className={`object-contain ${SIZES[size]} ${className}`}
    />
  );
}
