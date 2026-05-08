import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../../stores/authStore';
import type { Message, PartyNotice } from '../../../types/chat';
import { WS_BASE } from '../ChatConstants';

interface UseChatWebSocketProps {
  partyId: string | undefined;
  currentUserId: string;
  onPartyUpdated: () => void;
  onNoticeUpdated?: (notice: PartyNotice | null) => void;
  onSettlementApproved?: (settlementId: string) => void;
}

export function useChatWebSocket({
  partyId,
  currentUserId,
  onPartyUpdated,
  onNoticeUpdated,
  onSettlementApproved,
}: UseChatWebSocketProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const nicknameRef = useRef(useAuthStore.getState().user?.nickname ?? '익명');

  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const userReadyRef = useRef(false);

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.user?.nickname) nicknameRef.current = state.user.nickname;
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!partyId) return;

    let cancelled = false;

    const connect = async () => {
      if (!userReadyRef.current) await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const ws = new WebSocket(
        `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(
          nicknameRef.current,
        )}`,
      );

      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        userReadyRef.current = true;
      };

      ws.onclose = () => setConnected(false);

      ws.onmessage = async (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'message_deleted') {
            setMessages((prev) =>
              prev.filter((m) => m.content !== msg.content),
            );
            return;
          }

          if (msg.type === 'force_logout') {
            wsRef.current?.close();
            wsRef.current = null;
            const banType = msg.ban_type ?? null;
            const refId = msg.reference_id ?? '';

            await logout();

            if (!banType) {
              navigate('/login?reason=duplicate');
              return;
            }

            const params = new URLSearchParams({ reason: 'banned', ban_type: banType });
            if (refId) params.set('ref_id', refId);
            navigate(`/login?${params.toString()}`);
            return;
          }

          if (msg.type === 'party_updated') {
            onPartyUpdated();
            return;
          }

          if (msg.type === 'notice_updated') {
            onNoticeUpdated?.(msg.notice ?? null);
            return;
          }

          if (msg.type === 'notice_deleted') {
            onNoticeUpdated?.(null);
            return;
          }

          if (msg.type === 'settlement_approved') {
            onSettlementApproved?.(msg.settlement_id ?? '');
            return;
          }

          if (msg.type === 'read_update') {
            const readSet = new Set<string>(msg.chat_ids ?? []);
            if (readSet.size === 0) return;
            setUnreadCounts((prev) => {
              const next = { ...prev };
              readSet.forEach((chatId) => {
                if (next[chatId] !== undefined) {
                  next[chatId] = Math.max(0, next[chatId] - 1);
                }
              });
              return next;
            });
            setMessages((prev) =>
              prev.map((m) =>
                m.chat_id && readSet.has(m.chat_id)
                  ? {
                      ...m,
                      unread_count: Math.max(0, (m.unread_count ?? 0) - 1),
                    }
                  : m,
              ),
            );
            return;
          }

          const typedMsg = msg as Message;
          if (typedMsg.chat_id && typeof typedMsg.unread_count === 'number') {
            const adjusted =
              typedMsg.user_id !== currentUserId
                ? Math.max(0, typedMsg.unread_count - 1)
                : typedMsg.unread_count;
            typedMsg.unread_count = adjusted;
            setUnreadCounts((prev) => ({
              ...prev,
              [typedMsg.chat_id!]: adjusted,
            }));
          }
          setMessages((prev) => [...prev, typedMsg]);
        } catch (err) {
          console.error('메시지 파싱 에러:', err);
        }
      };

      ws.onerror = (e) => console.error('WebSocket 에러:', e);
    };

    connect();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [partyId, logout, navigate, currentUserId, onPartyUpdated]);

  const sendMessage = useCallback((input: string) => {
    if (
      !input.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    wsRef.current.send(input.trim());
  }, []);

  const initMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
    const counts: Record<string, number> = {};
    msgs.forEach((m) => {
      if (m.chat_id && typeof m.unread_count === 'number') {
        counts[m.chat_id] = m.unread_count;
      }
    });
    setUnreadCounts(counts);
  }, []);

  return { messages, unreadCounts, connected, sendMessage, initMessages };
}
