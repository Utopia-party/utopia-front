import { api } from '../api';

export type ReceiptRecord = {
  id: string;
  userId: string;
  partyId: string;
  ocrAmount: number;
  status: string;
  createdAt: string;
};

export type SettlementRecord = {
  id: string;
  partyId: string;
  partyName: string;
  leaderId: string;
  leaderName: string;
  totalAmount: number;
  memberCount: number;
  billingMonth: string;
  status: string;
  createdAt: string;
};

export type AdminPaymentRecord = {
  id: string;
  userId: string;
  userNickname: string;
  userName: string | null;
  partyId: string;
  partyTitle: string;
  serviceName: string | null;
  role: '방장' | '멤버';
  basePrice: number;
  amount: number;
  discountReason: string | null;
  commissionRate: number;
  commissionAmount: number;
  paymentMethod: string | null;
  status: string;
  billingMonth: string;
  pricingType: string | null;
  quickMatchFeeRate: number;
  paidAt: string | null;
  createdAt: string;
};

export type AdminPaymentListResponse = {
  items: AdminPaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchAdminReceipts(params?: {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<ReceiptRecord[]> {
  const { data } = await api.get<ReceiptRecord[]>('/api/admin/receipts', {
    params,
  });
  return data;
}

export async function updateAdminReceiptStatus(
  receiptId: string,
  status: string,
): Promise<ReceiptRecord> {
  const { data } = await api.patch<ReceiptRecord>(
    `/api/admin/receipts/${receiptId}`,
    { status },
  );
  return data;
}

export async function fetchAdminSettlements(params?: {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<SettlementRecord[]> {
  const { data } = await api.get<SettlementRecord[]>('/api/admin/settlements', {
    params,
  });
  return data;
}

export async function updateAdminSettlementStatus(
  settlementId: string,
  status: string,
): Promise<SettlementRecord> {
  const { data } = await api.patch<SettlementRecord>(
    `/api/admin/settlements/${settlementId}`,
    { status },
  );
  return data;
}

export async function fetchAdminPayments(params?: {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPaymentListResponse> {
  const { data } = await api.get<AdminPaymentListResponse>(
    '/api/admin/payments',
    { params },
  );
  return data;
}
