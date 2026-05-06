import { api } from '../api';

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  delta?: string | null;
  trend?: string | null;
};

export type DashboardSummaryRow = {
  label: string;
  value: string;
};

export type DashboardSeriesPoint = {
  label: string;
  current: number;
  comparison: number;
};

export type DashboardChart = {
  id: string;
  label: string;
  description: string;
  unit: string;
  points: DashboardSeriesPoint[];
};

export type DashboardRecentActivity = {
  timestamp: string;
  title: string;
  description: string;
};

type AdminDashboardApiResponse = {
  metrics: DashboardMetric[];
  member_stats: DashboardSummaryRow[];
  sales_stats: DashboardSummaryRow[];
  today_summary: string;
  period_label: string;
  comparison_label: string;
  compare_mode: string;
  range_start: string;
  range_end: string;
  chart_points: DashboardSeriesPoint[];
  chart_groups: DashboardChart[];
  recent_activities: DashboardRecentActivity[];
};

export type AdminDashboard = {
  metrics: DashboardMetric[];
  memberStats: DashboardSummaryRow[];
  salesStats: DashboardSummaryRow[];
  todaySummary: string;
  periodLabel: string;
  comparisonLabel: string;
  compareMode: string;
  rangeStart: string;
  rangeEnd: string;
  chartPoints: DashboardSeriesPoint[];
  chartGroups: DashboardChart[];
  recentActivities: DashboardRecentActivity[];
};

export async function fetchAdminDashboard(params?: {
  date_from?: string;
  date_to?: string;
  compare_mode?: 'previous_period' | 'year_over_year';
}): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboardApiResponse>(
    '/api/admin/dashboard',
    { params },
  );
  return {
    metrics: data.metrics,
    memberStats: data.member_stats,
    salesStats: data.sales_stats,
    todaySummary: data.today_summary,
    periodLabel: data.period_label,
    comparisonLabel: data.comparison_label,
    compareMode: data.compare_mode,
    rangeStart: data.range_start,
    rangeEnd: data.range_end,
    chartPoints: data.chart_points,
    chartGroups: data.chart_groups,
    recentActivities: data.recent_activities,
  };
}
