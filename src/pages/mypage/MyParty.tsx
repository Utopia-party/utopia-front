import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePageTitle } from '../../hooks/usePageTitle';

import {
  approveApplication,
  getMyParties,
  getPartyApplications,
  getPartyMembers,
  kickMember,
  leaveParty,
  rejectApplication,
  transferLeader,
} from '../../apis/party';
import type { MyParty, PartyMember } from '../../types/party';

type ModalMode = 'kick' | 'transfer' | 'leaderLeave';

interface MemberPickerModalProps {
  partyId: string;
  mode: ModalMode;
  onClose: () => void;
  onDone: () => void;
}

function errorMessage(e: unknown, fallback: string) {
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

function StatusBadge({ label, isOwner }: { label: string; isOwner: boolean }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-4 py-2 text-sm font-extrabold',
        isOwner
          ? 'border-orange-200 bg-orange-50 text-orange-500'
          : 'border-orange-200 bg-orange-50 text-orange-500',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function MemberPickerModal({
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
    // 자기 자신 제외. kick 모드는 리더도 제외.
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

  const kickMut = useMutation({
    mutationFn: (uid: string) => kickMember(partyId, uid),
  });
  const transferMut = useMutation({
    mutationFn: (uid: string) => transferLeader(partyId, uid),
  });
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
        // leaderLeave: 위임 → 탈퇴
        await transferMut.mutateAsync(selected);
        await leaveMut.mutateAsync();
      }
      await queryClient.invalidateQueries({ queryKey: ['my-parties'] });
      await queryClient.invalidateQueries({
        queryKey: ['party-members', partyId],
      });
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
            <div className="p-6 text-center text-sm text-slate-500">
              불러오는 중…
            </div>
          ) : pickableMembers.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              선택 가능한 멤버가 없습니다.
            </div>
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
                  <span className="font-semibold text-slate-800">
                    {m.nickname ?? '이름 없음'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {m.role === 'leader' ? '리더' : '멤버'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errMsg ? (
          <p className="mt-3 text-sm font-semibold text-red-500">{errMsg}</p>
        ) : null}

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

interface ConfirmLeaveModalProps {
  partyId: string;
  onClose: () => void;
  onDone: () => void;
}

function ConfirmLeaveModal({
  partyId,
  onClose,
  onDone,
}: ConfirmLeaveModalProps) {
  const queryClient = useQueryClient();
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => leaveParty(partyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-parties'] });
      onDone();
    },
    onError: (e) =>
      setErrMsg(errorMessage(e, '탈퇴 처리 중 오류가 발생했습니다.')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-[20px] font-extrabold text-slate-900">
          파티에서 탈퇴하시겠습니까?
        </h3>
        <p className="mt-2 text-sm font-medium text-slate-500">
          탈퇴 후에는 다시 리더의 승인이 있어야 참여할 수 있습니다.
        </p>
        {errMsg ? (
          <p className="mt-3 text-sm font-semibold text-red-500">{errMsg}</p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="h-12 flex-1 rounded-full border border-slate-200 bg-white text-sm font-extrabold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
            disabled={mut.isPending}
          >
            취소
          </button>
          <button
            type="button"
            className="h-12 flex-1 rounded-full bg-red-500 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-50"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
          >
            {mut.isPending ? '처리 중…' : '탈퇴'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ApplicationsModalProps {
  partyId: string;
  onClose: () => void;
}

function ApplicationsModal({ partyId, onClose }: ApplicationsModalProps) {
  const queryClient = useQueryClient();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['party-applications', partyId],
    queryFn: () => getPartyApplications(partyId),
  });

  const approveMut = useMutation({
    mutationFn: (uid: string) => approveApplication(partyId, uid),
  });
  const rejectMut = useMutation({
    mutationFn: (uid: string) => rejectApplication(partyId, uid),
  });

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
        <h3 className="text-[20px] font-extrabold text-slate-900">
          참여 신청 관리
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          신청자를 승인하거나 거절할 수 있습니다.
        </p>

        <div className="mt-5 max-h-[360px] overflow-y-auto rounded-2xl border border-slate-200">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              불러오는 중…
            </div>
          ) : applicants.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              대기 중인 신청자가 없습니다.
            </div>
          ) : (
            <ul>
              {applicants.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <span className="font-semibold text-slate-800">
                    {m.nickname ?? '이름 없음'}
                  </span>
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

        {errMsg ? (
          <p className="mt-3 text-sm font-semibold text-red-500">{errMsg}</p>
        ) : null}

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

export default function MyParty() {
  const navigate = useNavigate();

  usePageTitle('내 파티');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-parties'],
    queryFn: getMyParties,
  });

  const [modal, setModal] = useState<
    | { type: 'leaveMember'; partyId: string }
    | { type: 'leaveLeader'; partyId: string }
    | { type: 'kick'; partyId: string }
    | { type: 'transfer'; partyId: string }
    | { type: 'applications'; partyId: string }
    | null
  >(null);

  const parties: MyParty[] = data?.parties ?? [];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const names = parties
      .map((p) => p.category_name)
      .filter((c): c is string => c != null);
    return [...new Set(names)].sort();
  }, [parties]);

  const filteredParties = useMemo(
    () =>
      selectedCategory
        ? parties.filter((p) => p.category_name === selectedCategory)
        : parties,
    [parties, selectedCategory],
  );

  const closeModal = () => setModal(null);

  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 내 파티
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            내 파티 목록
          </p>
        </div>

        {parties.length > 0 && categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={[
                'rounded-full px-5 py-2 text-sm font-extrabold transition',
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
              onClick={() => setSelectedCategory(null)}
            >
              전체 ({parties.length})
            </button>
            {categories.map((cat) => {
              const count = parties.filter(
                (p) => p.category_name === cat,
              ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  className={[
                    'rounded-full px-5 py-2 text-sm font-extrabold transition',
                    selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            불러오는 중…
          </div>
        ) : isError ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-red-500 shadow-sm">
            목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        ) : parties.length === 0 ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            참여 중인 파티가 없습니다.
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            해당 카테고리의 파티가 없습니다.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {filteredParties.map((party) => {
              const isOwner = party.is_owner;
              const statusLabel = isOwner ? '내가 만든 파티' : '참여중';
              const priceLabel =
                party.monthly_price != null
                  ? `총액 ₩ ${party.monthly_price.toLocaleString()}`
                  : '가격 정보 없음';

              return (
                <article
                  key={party.id}
                  className="flex min-h-[610px] flex-col rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-600">
                      {party.category_name ?? '카테고리'}
                    </span>
                    <StatusBadge label={statusLabel} isOwner={isOwner} />
                  </div>

                  <h2 className="mt-5 text-[22px] font-extrabold leading-tight text-slate-900">
                    {party.title}
                  </h2>

                  <div className="mt-7 flex flex-col gap-3 text-slate-700">
                    <p className="text-[18px] font-extrabold text-slate-800">
                      👥 {party.member_count}/{party.max_members ?? '?'}
                    </p>
                    <p className="text-[16px] font-bold">📍 온라인</p>
                    <p className="text-[16px] font-extrabold text-slate-800">
                      💰 {priceLabel}
                    </p>
                  </div>

                  <div className="mt-7 flex flex-col gap-4">
                    <button
                      type="button"
                      className="h-14 rounded-full border border-slate-200 bg-white text-[16px] font-extrabold text-slate-900 transition hover:bg-slate-50"
                      onClick={() =>
                        setModal(
                          isOwner
                            ? { type: 'leaveLeader', partyId: party.id }
                            : { type: 'leaveMember', partyId: party.id },
                        )
                      }
                    >
                      파티 탈퇴
                    </button>

                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          className="h-14 rounded-full border border-amber-200 bg-amber-50 text-[16px] font-extrabold text-amber-700 transition hover:bg-amber-100"
                          onClick={() =>
                            setModal({
                              type: 'applications',
                              partyId: party.id,
                            })
                          }
                        >
                          참여 신청 관리
                        </button>
                        <button
                          type="button"
                          className="h-14 rounded-full border border-blue-200 bg-white text-[16px] font-extrabold text-primary transition hover:bg-blue-50"
                          onClick={() =>
                            setModal({ type: 'kick', partyId: party.id })
                          }
                        >
                          참여자 강퇴
                        </button>
                        <button
                          type="button"
                          className="h-14 rounded-full border border-blue-200 bg-white text-[16px] font-extrabold text-primary transition hover:bg-blue-50"
                          onClick={() =>
                            setModal({ type: 'transfer', partyId: party.id })
                          }
                        >
                          리더 위임
                        </button>
                      </>
                    ) : null}

                    <button
                      type="button"
                      className="h-14 rounded-full border border-blue-200 bg-primary text-[16px] font-extrabold text-white text-primary transition hover:opacity-90"
                      onClick={() => navigate(`/party/${party.id}/chat`)}
                    >
                      채팅방
                    </button>
                  </div>

                  <p className="mt-auto pt-5 text-sm font-semibold leading-6 text-slate-500">
                    {isOwner
                      ? '리더 권한: 모집 상태 관리/강퇴/리더 위임/파티 종료(스케줄링)'
                      : '채팅방에서: 정산요청/영수증 인증/채팅 신고 가능'}
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {modal?.type === 'leaveMember' ? (
        <ConfirmLeaveModal
          partyId={modal.partyId}
          onClose={closeModal}
          onDone={closeModal}
        />
      ) : null}

      {modal?.type === 'leaveLeader' ? (
        <MemberPickerModal
          partyId={modal.partyId}
          mode="leaderLeave"
          onClose={closeModal}
          onDone={closeModal}
        />
      ) : null}

      {modal?.type === 'kick' ? (
        <MemberPickerModal
          partyId={modal.partyId}
          mode="kick"
          onClose={closeModal}
          onDone={closeModal}
        />
      ) : null}

      {modal?.type === 'transfer' ? (
        <MemberPickerModal
          partyId={modal.partyId}
          mode="transfer"
          onClose={closeModal}
          onDone={closeModal}
        />
      ) : null}

      {modal?.type === 'applications' ? (
        <ApplicationsModal partyId={modal.partyId} onClose={closeModal} />
      ) : null}
    </div>
  );
}
