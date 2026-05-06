import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type ManualCalloutVariant = 'info' | 'warning' | 'success';

export type ManualCalloutProps = {
  variant?: ManualCalloutVariant;
  title: string;
  children: ReactNode;
};

const variantClassMap: Record<ManualCalloutVariant, string> = {
  info: 'border-blue-100 bg-blue-50 text-blue-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
};

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};

export default function ManualCallout({
  variant = 'info',
  title,
  children,
}: ManualCalloutProps) {
  const Icon = iconMap[variant];

  return (
    <div className={`rounded-3xl border p-5 ${variantClassMap[variant]}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-black">{title}</h3>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
