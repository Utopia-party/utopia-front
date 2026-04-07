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
const WS_BASE = API_BASE
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

  // 영수증 인증 상태
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 유저 정보 먼저 가져오기
  useEffect(() => {
    api.get('/api/me').then(({ data }) => {
      if (data.is_logged_in && data.user) {
        setNickname(data.user.nickname);
        setUserId(data.user.id);
      }
      setUserReady(true);
    }).catch(() => {
      setUserReady(true);
    });
  }, []);

  useEffect(() => {
    if (!partyId) return;

    api.get(`/chat/parties/${partyId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {});

    api.get(`/chat/parties/${partyId}/info`)
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
      `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(nickname)}&user_id=${encodeURIComponent(userId)}`
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
    // TODO: API 연동
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
      {/* 상단 헤더 */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 파티 목록
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-foreground truncate">
            {partyInfo?.title ?? '채팅방'}
          </h1>
          <p className="text-xs text-muted-foreground">
            정산요청 · 영수증 인증 · 채팅 신고 · 파티 멤버 표시
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 메시지 목록 */}
          <div className="px-5 pt-4 pb-1">
            <p className="text-sm font-bold text-foreground">메시지</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3 border border-border rounded-xl mx-5 mb-3 bg-white min-h-0">
            {messages.length === 0 && (
              <>
                <p className="text-xs text-muted-foreground">[시스템] 채팅방이 생성되었습니다.</p>
                <p className="text-sm">
                  <span className="font-bold">leader_01</span> : 반갑습니다! 정산은 매달 1일이에요.
                </p>
              </>
            )}
            {messages.map((msg, i) => renderMessage(msg, i))}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="mx-5 mb-3 flex gap-2">
            <input
              className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-background placeholder:text-muted-foreground"
              placeholder="메시지 입력"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!connected && messages.length === 0 ? false : !connected || !input.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              전송
            </button>
          </div>

          {/* 채팅 신고 / 정산 요청 버튼 */}
          <div className="mx-5 mb-4 flex gap-3">
            <button className="flex-1 py-3 border border-border rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              채팅 신고
            </button>
            <button className="flex-1 py-3 border-2 border-primary rounded-2xl text-sm font-bold text-primary hover:bg-primary/5 transition-colors">
              정산 요청
            </button>
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
          {/* 파티 멤버 */}
          <div className="p-5 border-b border-border">
            <p className="text-sm font-bold text-foreground mb-3">파티 멤버</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left pb-2 font-medium">닉네임</th>
                  <th className="text-left pb-2 font-medium">역할</th>
                  <th className="text-left pb-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(partyInfo?.members) && partyInfo.members.map(member => (
                  <tr key={member.user_id} className="border-t border-border/50">
                    <td className="py-2.5 text-foreground font-medium">{member.nickname}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {ROLE_LABEL[member.role] ?? member.role}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {STATUS_LABEL[member.status] ?? member.status}
                    </td>
                  </tr>
                ))}
                {/* 멤버 없을 때 데모 데이터 */}
                {(!partyInfo || !Array.isArray(partyInfo.members) || partyInfo.members.length === 0) && (
                  <>
                    {[
                      { nickname: 'leader_01', role: '리더', status: '정상' },
                      { nickname: 'user_02', role: '멤버', status: '정상' },
                      { nickname: 'user_03', role: '멤버', status: '정상' },
                    ].map((m) => (
                      <tr key={m.nickname} className="border-t border-border/50">
                        <td className="py-2.5 text-foreground font-medium">{m.nickname}</td>
                        <td className="py-2.5 text-muted-foreground">{m.role}</td>
                        <td className="py-2.5 text-muted-foreground">{m.status}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* 영수증 인증 */}
          <div className="p-5">
            <p className="text-sm font-bold text-foreground mb-3">영수증 인증</p>
            <p className="text-xs text-muted-foreground mb-3">영수증 업로드</p>

            {/* 파일 선택 */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
              >
                파일 선택
              </button>
              <span className="text-xs text-muted-foreground truncate">
                {receiptFile ? receiptFile.name : '선택된 파일 없음'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleReceiptChange}
              />
            </div>

            <p className="text-[11px] text-muted-foreground mb-4">
              OCR 분석 → 자동 승인 실패 시 관리자 검토
            </p>

            <button
              onClick={handleReceiptSubmit}
              className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              인증 요청
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
