import type { SizeType } from '../../types/size';

interface AvatarProps {
  src: string;
  alt: string;
  size?: SizeType;
}

const SIZES: Record<SizeType, string> = {
  xs: 'w-[12px]',
  sm: 'w-[24px]',
  md: 'w-[48px]',
  lg: 'w-[96px]',
  xlg: 'w-[128px]',
};

export default function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${SIZES[size]} rounded-full overflow-hidden mb-6 border-4 border-gray-50 shadow-inner`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}
