import { useState } from 'react';
import CategoryIconBadge from './CategoryIconBadge';

export default function ServiceLogo({
  logoUrl,
  serviceName,
  fallbackName,
  className = 'h-12 w-12 rounded-2xl',
  imageClassName = 'p-1.5',
  iconSize = 18,
}: {
  logoUrl: string | null;
  serviceName: string | null;
  fallbackName: string | null;
  className?: string;
  imageClassName?: string;
  iconSize?: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-slate-200 ${className}`}
      >
        <img
          src={logoUrl}
          alt={serviceName ?? '서비스 로고'}
          className={`h-full w-full object-contain ${imageClassName}`}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <CategoryIconBadge
      name={fallbackName}
      iconSize={iconSize}
      className={`shrink-0 ${className}`}
    />
  );
}
