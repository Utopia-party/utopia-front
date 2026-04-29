import { useState } from 'react';
import CategoryIconBadge from './CategoryIconBadge';

export default function ServiceLogo({
  logoUrl,
  serviceName,
  fallbackName,
}: {
  logoUrl: string | null;
  serviceName: string | null;
  fallbackName: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <img
          src={logoUrl}
          alt={serviceName ?? '서비스 로고'}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <CategoryIconBadge
      name={fallbackName}
      iconSize={18}
      className="h-12 w-12 shrink-0 rounded-2xl"
    />
  );
}
