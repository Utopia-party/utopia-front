import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveApplication,
  getPartyApplications,
  rejectApplication,
} from '../../../apis/party';
import type { PartyMember } from '../../../types/party';
import { errorMessage } from './MemberPickerModal';

interface ApplicationsModalProps {
  partyId: string;
  onClose: () => void;
}

export function ApplicationsModal({ partyId, onClose }: ApplicationsModalProps) {
  const queryClient = useQueryClient();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['party-applications', partyId],
    queryFn: () => getPartyApplications(partyId),
  });

  const approveMut = useMutation({ mutationFn: (uid: string) => approveApplication(partyId, uid) });
  const rejectMut = useMutation({ mutationFn: (uid: string) => rejectApplication(partyId, uid) });

  const applicants: PartyMember[] = data?.members ?? [];
  const busy = approveMut.isPending || rejectMut.isPending;

  const handleApprove = async (uid: string) => {
    setErrMsg(null);
    try {
      await approveMut.mutateAsync(uid);
      await queryClient.invalidateQueries({ queryKey: ['my-parties'] });
      await refetch();
    } catch (e) {
      setErrMsg(errorMessage(e, '승인 처리 중 오류가 발생했습니다.'));
    }
  };

  const handleReject = async (uid: string) => {
    setErrMsg(null);
    try {
      await rejectMut.mutateAsync(uid);
      await refetch();
    } catch (e) {
      setErrMsg(errorMessage(e, '거절 처리 중 오류가 발생했습니다.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[500px] rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-[20px] font-extrabold text-slate-900">참여 신청 관리</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">신청자를 승인하거나 거절할 수 있습니다.</p>

        <div className="mt-5 max-h-[360px] overflow-y-auto rounded-2xl border border-slate-200">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">불러오는 중…</div>
          ) : applicants.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">대기 중인 신청자가 없습니다.</div>
          ) : (
            <ul>
              {applicants.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <span className="font-semibold text-slate-800">{m.nickname ?? '이름 없음'}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
                      onClick={() => handleApprove(m.user_id)}
                      disabled={busy}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => handleReject(m.user_id)}
                      disabled={busy}
                    >
                      거절
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errMsg && <p className="mt-3 text-sm font-semibold text-red-500">{errMsg}</p>}

        <div className="mt-6">
          <button
            type="button"
            className="h-12 w-full rounded-full border border-slate-200 bg-white text-sm font-extrabold text-slate-900 hover:bg-slate-50"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
