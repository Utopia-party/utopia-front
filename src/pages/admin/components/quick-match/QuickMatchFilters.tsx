import type { QuickMatchServiceOption } from '../../../../types/admin/adminQuickMatch';

type Props = {
  status: string;
  serviceName: string;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  services: QuickMatchServiceOption[];
};

export default function QuickMatchFilters({
  status,
  serviceName,
  onChange,
  onReset,
  services,
}: Props) {
  const statusOptions = [
    '전체',
    'REQUESTED',
    'MATCHED',
    'FAILED',
    'EXPIRED',
    'REMATCHING',
    'CANCELLED',
    'TIMEOUT',
    'BLOCKED',
  ];

  const serviceOptions = [
    { label: '전체', value: '전체' },
    ...services.map((s) => ({
      label: s.serviceName,
      value: s.serviceName,
    })),
  ];

  return (
    <div className="flex gap-2 items-center">
      {/* 상태 필터 */}
      <select
        value={status}
        onChange={(e) => onChange('status', e.target.value)}
      >
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* 서비스 필터 */}
      <select
        value={serviceName}
        onChange={(e) => onChange('serviceName', e.target.value)}
      >
        {serviceOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button onClick={onReset}>초기화</button>
    </div>
  );
}
