import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchMyKeys,
  createMyKey,
  updateMyKey,
  deleteMyKey,
  rotateMySecret,
  fetchMyUsageLogs,
  fetchMyUsageSummary,
  type MyApiKey,
  type UsageLogItem,
  type UsageSummary,
} from '../../apis/developer';
import { usePageTitle } from '../../hooks/usePageTitle';

import type {
  ApiKeyCreatePayload,
  ApiKeyUpdatePayload,
} from '../../apis/developer';

interface ExpandedKey {
  [keyId: string]: boolean;
}

interface ModalState {
  type: 'create' | 'rotate' | 'edit' | null;
  keyId?: string;
}

export default function MyDeveloper() {
  usePageTitle('캡챠 SaaS');

  const [keys, setKeys] = useState<MyApiKey[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageLogs, setUsageLogs] = useState<{
    [keyId: string]: UsageLogItem[];
  }>({});
  const [expandedKeys, setExpandedKeys] = useState<ExpandedKey>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [createdKey, setCreatedKey] = useState<MyApiKey | null>(null);
  const [rotatedKey, setRotatedKey] = useState<MyApiKey | null>(null);

  const [editForm, setEditForm] = useState<{
    client_name: string;
    allowed_domains: string;
  }>({ client_name: '', allowed_domains: '' });

  const [createForm, setCreateForm] = useState<{
    client_name: string;
    allowed_domains: string;
  }>({ client_name: '', allowed_domains: '' });

  // 초기 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysData, summaryData] = await Promise.all([
        fetchMyKeys(),
        fetchMyUsageSummary(),
      ]);
      setKeys(keysData.items);
      setUsageSummary(summaryData);
    } catch (err) {
      setError((err as Error).message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 사용 로그 로드
  const loadUsageLogs = useCallback(async (keyId: string) => {
    try {
      const data = await fetchMyUsageLogs(keyId, { page: 1, size: 20 });
      setUsageLogs((prev) => ({
        ...prev,
        [keyId]: data.items,
      }));
    } catch (err) {
      console.error('사용 로그 로드 실패:', err);
    }
  }, []);

  // API 키 생성
  const handleCreateKey = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!createForm.client_name.trim()) {
        setError('서비스명을 입력해주세요.');
        return;
      }

      try {
        const payload: ApiKeyCreatePayload = {
          client_name: createForm.client_name.trim(),
        };

        if (createForm.allowed_domains.trim()) {
          payload.allowed_domains = createForm.allowed_domains
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean);
        }

        const result = await createMyKey(payload);
        setCreatedKey(result);
        setCreateForm({ client_name: '', allowed_domains: '' });
        setModalState({ type: 'create' });
        await loadData();
      } catch (err) {
        setError((err as Error).message || '키 생성 실패');
      }
    },
    [createForm, loadData],
  );

  // API 키 수정
  const handleEditKey = useCallback(
    async (keyId: string) => {
      const key = keys.find((k) => k.id === keyId);
      if (!key) return;

      setEditForm({
        client_name: key.client_name,
        allowed_domains: key.allowed_domains?.join(', ') || '',
      });
      setModalState({ type: 'edit', keyId });
    },
    [keys],
  );

  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!modalState.keyId) return;

      try {
        const payload: ApiKeyUpdatePayload = {
          client_name: editForm.client_name.trim(),
        };

        if (editForm.allowed_domains.trim()) {
          payload.allowed_domains = editForm.allowed_domains
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean);
        } else {
          payload.allowed_domains = [];
        }

        await updateMyKey(modalState.keyId, payload);
        setModalState({ type: null });
        await loadData();
      } catch (err) {
        setError((err as Error).message || '수정 실패');
      }
    },
    [modalState.keyId, editForm, loadData],
  );

  // Secret Key 재발급
  const handleRotateSecret = useCallback(
    async (keyId: string) => {
      const confirmed = window.confirm(
        '기존 Secret Key는 즉시 무효화됩니다. 계속하시겠습니까?',
      );
      if (!confirmed) return;

      try {
        const result = await rotateMySecret(keyId);
        setRotatedKey(result);
        setModalState({ type: 'rotate' });
        await loadData();
      } catch (err) {
        setError((err as Error).message || 'Secret Key 재발급 실패');
      }
    },
    [loadData],
  );

  // API 키 삭제
  const handleDeleteKey = useCallback(
    async (keyId: string, clientName: string) => {
      const confirmed = window.confirm(
        `"${clientName}" API 키를 삭제하시겠습니까?\n삭제된 키는 즉시 무효화되며 복구할 수 없습니다.`,
      );
      if (!confirmed) return;

      try {
        await deleteMyKey(keyId);
        await loadData();
      } catch (err) {
        setError((err as Error).message || '키 삭제 실패');
      }
    },
    [loadData],
  );

  // 사용 로그 토글
  const toggleLogs = useCallback(
    (keyId: string) => {
      setExpandedKeys((prev) => ({
        ...prev,
        [keyId]: !prev[keyId],
      }));

      if (!expandedKeys[keyId] && !usageLogs[keyId]) {
        loadUsageLogs(keyId);
      }
    },
    [expandedKeys, usageLogs, loadUsageLogs],
  );

  // 클립보드 복사
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}가 복사되었습니다.`);
  }, []);

  const hasKeys = keys.length > 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '30px' }}>
        <h1
          style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600' }}
        >
          캡챠 SaaS
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          PartyUp 캡챠 API 키 관리
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          로딩 중...
        </div>
      )}

      {!loading && (
        <>
          {/* 통계 카드 */}
          {usageSummary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '5px',
                  }}
                >
                  전체 API 키
                </div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                  {usageSummary.total_keys}
                </div>
              </div>

              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '5px',
                  }}
                >
                  활성 키
                </div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                  {usageSummary.active_keys}
                </div>
              </div>

              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '5px',
                  }}
                >
                  이번 달 총 요청
                </div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                  {usageSummary.total_usage_this_month.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* "새 API 키 발급" 버튼 + 데모 사이트 링크 */}
          <div
            style={{
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setModalState({ type: 'create' })}
              disabled={keys.length >= 3}
              style={{
                padding: '10px 20px',
                backgroundColor: keys.length >= 3 ? '#999' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: keys.length >= 3 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: keys.length >= 3 ? 0.6 : 1,
              }}
            >
              새 API 키 발급
            </button>
            <a
              href="https://zeroh00n.github.io/partyup-demo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                border: '1px solid #90caf9',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              API SaaS 테스트 ↗
            </a>
            {keys.length >= 3 && (
              <span style={{ fontSize: '13px', color: '#999' }}>
                최대 3개까지 발급 가능합니다.
              </span>
            )}
          </div>

          {/* API 키 목록 */}
          {hasKeys ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              {keys.map((key) => (
                <div
                  key={key.id}
                  style={{
                    padding: '20px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* 헤더 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                        {key.client_name}
                      </h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '3px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {key.plan.toUpperCase()}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            backgroundColor: key.is_active
                              ? '#e3f2fd'
                              : '#f3e5f5',
                            color: key.is_active ? '#1565c0' : '#6a1b9a',
                            borderRadius: '3px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {key.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditKey(key.id)}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id, key.client_name)}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#ffebee',
                          border: '1px solid #ef9a9a',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#c62828',
                          fontWeight: '600',
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* Site Key */}
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#999',
                        marginBottom: '5px',
                      }}
                    >
                      Site Key (공개 키)
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <code
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          overflow: 'auto',
                        }}
                      >
                        {key.api_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.api_key, 'Site Key')}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        복사
                      </button>
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#999',
                        marginBottom: '5px',
                      }}
                    >
                      Secret Key (비밀 키)
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <code
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          overflow: 'auto',
                        }}
                      >
                        {key.secret_key}
                      </code>
                      <button
                        onClick={() => handleRotateSecret(key.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fff3e0',
                          border: '1px solid #ffb74d',
                          borderRadius: '4px',
                          color: '#e65100',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        재발급
                      </button>
                    </div>
                  </div>

                  {/* 허용 도메인 */}
                  {key.allowed_domains && key.allowed_domains.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#999',
                          marginBottom: '5px',
                        }}
                      >
                        허용 도메인
                      </label>
                      <div style={{ fontSize: '13px' }}>
                        {key.allowed_domains.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* 사용량 진행률 */}
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '5px',
                      }}
                    >
                      <span>이번 달 사용량</span>
                      <span>
                        {key.current_month_usage.toLocaleString()} /{' '}
                        {key.monthly_limit.toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(
                            (key.current_month_usage / key.monthly_limit) * 100,
                            100,
                          )}%`,
                          backgroundColor:
                            key.current_month_usage > key.monthly_limit * 0.9
                              ? '#d32f2f'
                              : '#4caf50',
                        }}
                      />
                    </div>
                  </div>

                  {/* 생성 날짜 */}
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '15px',
                    }}
                  >
                    생성일: {key.created_at || '-'}
                  </div>

                  {/* 사용 로그 토글 */}
                  <button
                    onClick={() => toggleLogs(key.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      width: '100%',
                    }}
                  >
                    {expandedKeys[key.id]
                      ? '사용 로그 숨기기'
                      : '사용 로그 보기'}
                  </button>

                  {/* 사용 로그 테이블 */}
                  {expandedKeys[key.id] && (
                    <div style={{ marginTop: '15px' }}>
                      {usageLogs[key.id] && usageLogs[key.id].length > 0 ? (
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '13px',
                          }}
                        >
                          <thead>
                            <tr style={{ borderBottom: '2px solid #ddd' }}>
                              <th
                                style={{
                                  padding: '8px',
                                  textAlign: 'left',
                                  fontWeight: '600',
                                }}
                              >
                                엔드포인트
                              </th>
                              <th
                                style={{
                                  padding: '8px',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                }}
                              >
                                상태 코드
                              </th>
                              <th
                                style={{
                                  padding: '8px',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                }}
                              >
                                응답 시간 (ms)
                              </th>
                              <th
                                style={{
                                  padding: '8px',
                                  textAlign: 'left',
                                  fontWeight: '600',
                                }}
                              >
                                시간
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageLogs[key.id].map((log) => (
                              <tr
                                key={log.id}
                                style={{ borderBottom: '1px solid #eee' }}
                              >
                                <td style={{ padding: '8px' }}>
                                  {log.endpoint}
                                </td>
                                <td
                                  style={{
                                    padding: '8px',
                                    textAlign: 'center',
                                    color:
                                      log.status_code >= 400
                                        ? '#d32f2f'
                                        : '#4caf50',
                                    fontWeight: '600',
                                  }}
                                >
                                  {log.status_code}
                                </td>
                                <td
                                  style={{ padding: '8px', textAlign: 'right' }}
                                >
                                  {log.response_time_ms || '-'}
                                </td>
                                <td style={{ padding: '8px', color: '#999' }}>
                                  {log.created_at || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div
                          style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#999',
                          }}
                        >
                          사용 기록이 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px dashed #ddd',
                color: '#999',
              }}
            >
              <p style={{ margin: 0, marginBottom: '15px' }}>
                아직 API 키가 없습니다.
              </p>
              <button
                onClick={() => setModalState({ type: 'create' })}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                첫 번째 API 키 발급하기
              </button>
            </div>
          )}
        </>
      )}

      {/* 모달: 새 API 키 발급 */}
      {modalState.type === 'create' && !createdKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalState({ type: null })}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
              새 API 키 발급
            </h2>

            <form onSubmit={handleCreateKey}>
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '5px',
                  }}
                >
                  서비스명 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  type="text"
                  value={createForm.client_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      client_name: e.target.value,
                    }))
                  }
                  placeholder="예: My Web Service"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>
                    허용 도메인 (쉼표로 구분)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm((prev) => {
                        const testDomain = 'zeroh00n.github.io';
                        const current = prev.allowed_domains.trim();
                        if (current.includes(testDomain)) return prev;
                        return {
                          ...prev,
                          allowed_domains: current
                            ? `${current}, ${testDomain}`
                            : testDomain,
                        };
                      })
                    }
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#e8f5e9',
                      border: '1px solid #a5d6a7',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#2e7d32',
                      fontWeight: '600',
                    }}
                  >
                    테스트 사이트 추가
                  </button>
                </div>
                <input
                  type="text"
                  value={createForm.allowed_domains}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      allowed_domains: e.target.value,
                    }))
                  }
                  placeholder="example.com, app.example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalState({ type: null })}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  발급
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 생성된 키 정보 표시 */}
      {createdKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setCreatedKey(null);
            setModalState({ type: null });
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
              API 키 발급 완료
            </h2>
            <p
              style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}
            >
              아래 키를 안전한 곳에 저장해주세요.
            </p>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#856404',
              }}
            >
              ⚠️ Secret Key는 지금만 확인 가능합니다. 창을 닫으면 다시 볼 수
              없으니 반드시 저장해주세요.
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: '5px',
                }}
              >
                Site Key (공개 키)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <code
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                  }}
                >
                  {createdKey.api_key}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(createdKey.api_key, 'Site Key')
                  }
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  복사
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: '5px',
                }}
              >
                Secret Key (비밀 키)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <code
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    wordBreak: 'break-all',
                  }}
                >
                  {createdKey.secret_key}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(createdKey.secret_key, 'Secret Key')
                  }
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  복사
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setCreatedKey(null);
                setModalState({ type: null });
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 모달: 회전된 Secret Key 표시 */}
      {rotatedKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setRotatedKey(null);
            setModalState({ type: null });
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
              Secret Key 재발급 완료
            </h2>
            <p
              style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}
            >
              새로운 Secret Key입니다. 안전한 곳에 저장해주세요.
            </p>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#856404',
              }}
            >
              ⚠️ 기존 Secret Key는 더 이상 사용할 수 없습니다.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: '5px',
                }}
              >
                새 Secret Key
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <code
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    wordBreak: 'break-all',
                  }}
                >
                  {rotatedKey.secret_key}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(rotatedKey.secret_key, 'Secret Key')
                  }
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  복사
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setRotatedKey(null);
                setModalState({ type: null });
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 모달: API 키 수정 */}
      {modalState.type === 'edit' && modalState.keyId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalState({ type: null })}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
              API 키 수정
            </h2>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '5px',
                  }}
                >
                  서비스명
                </label>
                <input
                  type="text"
                  value={editForm.client_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      client_name: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '5px',
                  }}
                >
                  허용 도메인 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={editForm.allowed_domains}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      allowed_domains: e.target.value,
                    }))
                  }
                  placeholder="example.com, app.example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalState({ type: null })}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
