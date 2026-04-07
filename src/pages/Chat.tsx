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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const WS_BASE = import.meta.env.VITE_WS_BASE_URL ??
  API_BASE
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace('/api', '');

const ROLE_LABEL: Record<string, string> = {
  leader: '리더',
  member: '멤버',
};

const STATUS_LABEL: Record<string, string> = {
  active: '정상',
  pending: '대기',
  banned: '정지',
};

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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/api/me').then(({ data }) => {
      if (data.is_logged_in && data.user) {
        setNickname(data.user.nickname);
        setUserId(data.user.user_id);
      }
      setUserReady(true);
    }).catch(() => {
      setUserReady(true);
    });
  }, []);

  useEffect(() => {
    if (!partyId) return;

    api.get(`/chat/parties/${partyId}/messages`)
      .then(({ data }) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("메시지 로딩 실패:", err);
        setMessages([]);
      });

    api.get(`/chat/parties/${partyId}/info`)
      .then(({ data }) => setPartyInfo(data))
      .catch(() => {});
  }, [partyId]);

  useEffect(() => {
    if (!partyId || !userReady) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

    connectedRef.current = true;

    const ws = new WebSocket(
      `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(nickname)}&user_id=${encodeURIComponent(userId)}`
    );
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      connectedRef.current = false;
    };
    ws.onmessage = (e) => {
      try {
        const msg: Message = JSON.parse(e.data);
        setMessages(prev => [...prev, msg]);
      } catch (err) {
        console.error("메시지 파싱 에러:", err);
      }
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
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(input.trim());
    setInput('');
  }, [input]);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
  };

  const handleReceiptSubmit = () => {
    if (!receiptFile) {
      alert('파일을 선택해주세요.');
      return;
    }
    alert(`"${receiptFile.name}" 인증 요청이 제출되었습니다.`);
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
    if (msg.type === 'warning' || msg.type === 'error') {
      const isError = msg.type === 'error';
      return (
        <div key={i} className="flex justify-center">
          <span className={`text-xs ${isError ? 'text-red-600 bg-red-50 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-200'} border px-3 py-1.5 rounded-xl`}>
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
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/home')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← 파티 목록
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-foreground truncate">
            {partyInfo?.title ?? '채팅방'}
          </h1>
          <p className="text-xs text-muted-foreground">정산요청 · 영수증 인증 · 채팅 신고</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 pt-4 pb-1">
            <p className="text-sm font-bold text-foreground">메시지</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3 border border-border rounded-xl mx-5 mb-3 bg-white min-h-0">
            {Array.isArray(messages) && messages.length > 0 ? (
              messages.map((msg, i) => renderMessage(msg, i))
            ) : (
              <p className="text-xs text-muted-foreground">[시스템] 채팅방이 생성되었습니다.</p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mx-5 mb-3 flex gap-2">
            <input
              className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary bg-background"
              placeholder="메시지 입력"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold disabled:opacity-40"
            >
              전송
            </button>
          </div>

          <div className="mx-5 mb-4 flex gap-3">
            <button className="flex-1 py-3 border border-border rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
              채팅 신고
            </button>
            <button className="flex-1 py-3 border-2 border-primary rounded-2xl text-sm font-bold text-primary hover:bg-primary/5">
              정산 요청
            </button>
          </div>
        </div>

        <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-border">
            <p className="text-sm font-bold text-foreground mb-3">파티 멤버</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left pb-2">닉네임</th>
                  <th className="text-left pb-2">역할</th>
                  <th className="text-left pb-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(partyInfo?.members) && partyInfo.members.map(member => (
                  <tr key={member.user_id} className="border-t border-border/50">
                    <td className="py-2.5 font-medium">{member.nickname}</td>
                    <td className="py-2.5 text-muted-foreground">{ROLE_LABEL[member.role] ?? member.role}</td>
                    <td className="py-2.5 text-muted-foreground">{STATUS_LABEL[member.status] ?? member.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5">
            <p className="text-sm font-bold text-foreground mb-3">영수증 인증</p>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shrink-0">
                파일 선택
              </button>
              <span className="text-xs text-muted-foreground truncate">{receiptFile ? receiptFile.name : '선택된 파일 없음'}</span>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptChange} />
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">OCR 분석 → 자동 승인 실패 시 관리자 검토</p>
            <button onClick={handleReceiptSubmit} className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold active:scale-[0.98]">
              인증 요청
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
