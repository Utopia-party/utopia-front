import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  getPartyMembers,
  kickMember,
  leaveParty,
  transferLeader,
} from '../../../apis/party';
import type { PartyMember } from '../../../types/party';

export type ModalMode = 'kick' | 'transfer' | 'leaderLeave';

export function errorMessage(e: unknown, fallback: string) {
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

interface MemberPickerModalProps {
  partyId: string;
  mode: ModalMode;
  onClose: () => void;
  onDone: () => void;
}

export function MemberPickerModal({
  partyId,
  mode,
  onClose,
  onDone,
}: MemberPickerModalProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['party-members', partyId],
    queryFn: () => getPartyMembers(partyId),
  });

  const pickableMembers: PartyMember[] = useMemo(() => {
    const list = data?.members ?? [];
    return list.filter((m) => !m.is_current_user && m.role !== 'leader');
  }, [data]);

  const title =
    mode === 'kick'
      ? '강퇴할 멤버 선택'
      : mode === 'transfer'
        ? '리더를 위임할 멤버 선택'
        : '탈퇴 전 리더를 위임할 멤버 선택';

  const confirmLabel =
    mode === 'kick' ? '강퇴' : mode === 'transfer' ? '위임' : '위임 후 탈퇴';

  const kickMut = useMutation({ mutationFn: (uid: string) => kickMember(partyId, uid) });
  const transferMut = useMutation({ mutationFn: (uid: string) => transferLeader(partyId, uid) });
  const leaveMut = useMutation({ mutationFn: () => leaveParty(partyId) });

  const handleConfirm = async () => {
    if (!selected) return;
    setErrMsg(null);
    try {
      if (mode === 'kick') {
        await kickMut.mutateAsync(selected);
      } else if (mode === 'transfer') {
        await transferMut.mutateAsync(selected);
      } else {
        await transferMut.mutateAsync(selected);
        await leaveMut.mutateAsync();
      }
      await queryClient.invalidateQueries({ queryKey: ['my-parties'] });
      await queryClient.invalidateQueries({ queryKey: ['party-members', partyId] });
      onDone();
    } catch (e) {
      setErrMsg(errorMessage(e, '처리 중 오류가 발생했습니다.'));
    }
  };

  const busy = kickMut.isPending || transferMut.isPending || leaveMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-[20px] font-extrabold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {mode === 'leaderLeave'
            ? '리더는 반드시 리더 위임 후 탈퇴할 수 있습니다.'
            : '아래에서 한 명을 선택하세요.'}
        </p>

        <div className="mt-5 max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">불러오는 중…</div>
          ) : pickableMembers.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">선택 가능한 멤버가 없습니다.</div>
          ) : (
            <ul>
              {pickableMembers.map((m) => (
                <li
                  key={m.user_id}
                  className={[
                    'flex cursor-pointer items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0',
                    selected === m.user_id ? 'bg-blue-50' : 'hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setSelected(m.user_id)}
                >
                  <span className="font-semibold text-slate-800">{m.nickname ?? '이름 없음'}</span>
                  <span className="text-xs font-bold text-slate-400">
                    {m.role === 'leader' ? '리더' : '멤버'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errMsg && <p className="mt-3 text-sm font-semibold text-red-500">{errMsg}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="h-12 flex-1 rounded-full border border-slate-200 bg-white text-sm font-extrabold text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
            disabled={busy}
          >
            취소
          </button>
          <button
            type="button"
            className="h-12 flex-1 rounded-full bg-primary text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!selected || busy}
          >
            {busy ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
