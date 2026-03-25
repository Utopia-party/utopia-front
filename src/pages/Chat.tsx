import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../libs/api';

interface Message {
  type: 'message' | 'system' | 'warning' | 'error';
  room_id?: number;
  user_id?: string;
  nickname?: string;
  content: string;
  created_at: string;
}

interface Member {
  user_id: number;
  nickname: string;
  role: string;
  payment_status: number;
}

interface RoomInfo {
  party_id: number;
  title: string;
  members: Member[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const WS_BASE = API_BASE
  .replace('http://', 'ws://')
  .replace('https://', 'wss://')
  .replace('/api', '');

export default function Chat() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [nickname] = useState(() => localStorage.getItem('nickname') ?? '익명');
  const [userId] = useState(() => localStorage.getItem('user_id') ?? 'guest');

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectedRef = useRef(false); // 중복 연결 방지

  // 채팅방 생성/조회
  useEffect(() => {
    if (!partyId) return;
    api.post(`/chat/rooms/${partyId}`)
      .then(({ data }) => setRoomId(data.chat_room_id))
      .catch(() => navigate('/'));

    api.get(`/chat/rooms/${partyId}/info`)
      .then(({ data }) => setRoomInfo(data))
      .catch(() => {});
  }, [partyId]);

  // WebSocket 연결
  useEffect(() => {
    if (!roomId) return;
    if (connectedRef.current) return; // 이미 연결됐으면 스킵
    connectedRef.current = true;

    // 이전 메시지 로드
    api.get(`/chat/rooms/${roomId}/messages`)
      .then(({ data }) => setMessages(data));

    // 기존 연결 정리
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(
      `${WS_BASE}/api/chat/ws/${roomId}?nickname=${encodeURIComponent(nickname)}&user_id=${encodeURIComponent(userId)}`
    );
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      connectedRef.current = false;
    };
    ws.onmessage = (e) => {
      const msg: Message = JSON.parse(e.data);
      setMessages(prev => [...prev, msg]);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      connectedRef.current = false;
    };
  }, [roomId]);

  // 스크롤 하단
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(input.trim());
    setInput('');
  };

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
      <div key={i} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && <p className="text-xs text-muted-foreground px-2">{msg.nickname}</p>}
        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}>
          {msg.content}
        </div>
        <p className="text-[10px] text-muted-foreground px-2">
          {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 파티 목록
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {roomInfo?.title ?? '채팅방'}
          </p>
          <p className="text-xs text-muted-foreground">
            {connected ? '🟢 연결됨' : '🔴 연결 중...'}
            {roomInfo && ` · 멤버 ${roomInfo.members.length}명`}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">첫 메시지를 보내보세요!</p>
              </div>
            )}
            {messages.map((msg, i) => renderMessage(msg, i))}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="bg-card border-t border-border px-4 py-3 flex gap-2 shrink-0">
            <input
              className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-background"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
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

        {/* 파티 멤버 사이드바 */}
        <div className="w-56 shrink-0 border-l border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">파티 멤버</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roomInfo?.members.map(member => (
              <div key={member.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {member.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.nickname}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${member.payment_status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {member.payment_status === 1 ? '납부' : '미납'}
                </span>
              </div>
            ))}
            {(!roomInfo || roomInfo.members.length === 0) && (
              <p className="text-xs text-muted-foreground px-4 py-3">멤버 정보 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
