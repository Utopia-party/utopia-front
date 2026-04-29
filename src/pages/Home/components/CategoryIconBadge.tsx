import { Briefcase, Grid2x2 } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_ICON_TONE } from '../../../constants/party';

export default function CategoryIconBadge({
  name,
  iconSize = 16,
  className = '',
  active = false,
}: {
  name: string | null;
  iconSize?: number;
  className?: string;
  active?: boolean;
}) {
  const Icon = name ? CATEGORY_ICON[name] || Briefcase : Grid2x2;
  const toneClass = active
    ? 'bg-white/14 text-white ring-white/15'
    : name
      ? CATEGORY_ICON_TONE[name] || CATEGORY_ICON_TONE['기타']
      : 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <span
      className={`flex items-center justify-center rounded-xl ring-1 ${toneClass} ${className}`}
    >
      <Icon size={iconSize} strokeWidth={2.1} />
    </span>
  );
}
