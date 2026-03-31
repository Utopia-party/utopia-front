import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../libs/api';

interface Message {
  type: 'message' | 'system' | 'warning' | 'error';
  party_id?: string;
  user_id?: string;
  nickname?: string;
  content: string;
  created_at: string;
}

interface Member {
  user_id: string;
  nickname: string;
  role: string;
  status: string;
}

interface PartyInfo {
  party_id: string;
  title: string;
  members: Member[];
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const WS_BASE = API_BASE.replace('http://', 'ws://')
  .replace('https://', 'wss://')
  .replace('/api', '');

export default function Chat() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [nickname, setNickname] = useState('익명');
  const [userId, setUserId] = useState('guest');
  const [userReady, setUserReady] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectedRef = useRef(false);

  // 유저 정보 먼저 가져오기
  useEffect(() => {
    api
      .get('/me')
      .then(({ data }) => {
        if (data.is_logged_in && data.user) {
          setNickname(data.user.nickname);
          setUserId(data.user.id);
        }
        setUserReady(true);
      })
      .catch(() => {
        setUserReady(true);
      });
  }, []);

  useEffect(() => {
    if (!partyId) return;

    api
      .get(`/chat/parties/${partyId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {});

    api
      .get(`/chat/parties/${partyId}/info`)
      .then(({ data }) => setPartyInfo(data))
      .catch(() => {});
  }, [partyId]);

  // WebSocket 연결 - 유저 정보 로드 후 연결
  useEffect(() => {
    if (!partyId || !userReady) return;
    if (connectedRef.current) return;
    connectedRef.current = true;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(
      `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(nickname)}&user_id=${encodeURIComponent(userId)}`,
    );
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      connectedRef.current = false;
    };
    ws.onmessage = (e) => {
      const msg: Message = JSON.parse(e.data);
      setMessages((prev) => [...prev, msg]);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      connectedRef.current = false;
    };
  }, [partyId, userReady, nickname, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (
      !input.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;
    wsRef.current.send(input.trim());
    setInput('');
  }, [input]);

  const renderMessage = (msg: Message, i: number) => {
    const isMe = msg.nickname === nickname;

    if (msg.type === 'system') {
      return (
        <div key={i} className="flex justify-center">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {msg.content}
          </span>
        </div>
      );
    }
    if (msg.type === 'warning') {
      return (
        <div key={i} className="flex justify-center">
          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
            {msg.content}
          </span>
        </div>
      );
    }
    if (msg.type === 'error') {
      return (
        <div key={i} className="flex justify-center">
          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
            {msg.content}
          </span>
        </div>
      );
    }

    return (
      <div
        key={i}
        className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}
      >
        {!isMe && (
          <p className="text-xs text-muted-foreground px-2">{msg.nickname}</p>
        )}
        <div
          className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}
        >
          {msg.content}
        </div>
        <p className="text-[10px] text-muted-foreground px-2">
          {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 파티 목록
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {partyInfo?.title ?? '채팅방'}
          </p>
          <p className="text-xs text-muted-foreground">
            {connected ? '🟢 연결됨' : '🔴 연결 중...'}
            {partyInfo && ` · 멤버 ${partyInfo.members.length}명`}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  첫 메시지를 보내보세요!
                </p>
              </div>
            )}
            {messages.map((msg, i) => renderMessage(msg, i))}
            <div ref={bottomRef} />
          </div>

          <div className="bg-card border-t border-border px-4 py-3 flex gap-2 shrink-0">
            <input
              className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-background"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              전송
            </button>
          </div>
        </div>

        <div className="w-56 shrink-0 border-l border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              파티 멤버
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {partyInfo?.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {member.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.nickname}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
            {(!partyInfo || partyInfo.members.length === 0) && (
              <p className="text-xs text-muted-foreground px-4 py-3">
                멤버 정보 없음
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
