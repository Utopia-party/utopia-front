/**
 * useBehaviorCollector
 * 페이지 마운트 시 마우스/클릭/키 입력을 수집하는 훅
 * CONTEXT.md Section 4 — JS SDK 행동 데이터 페이로드 구조 기반
 */
import { useEffect, useRef, useCallback } from 'react';

// ── 타입 정의 ──────────────────────────────────────
export interface MouseMove {
  x: number;
  y: number;
  t: number; // ms since page load
}

export interface ClickEvent {
  x: number;
  y: number;
  t: number;
  target: string;
}

export interface EnvInfo {
  webdriver: boolean;
  plugins_count: number;
  canvas_hash: string;
  webgl_renderer: string;
  screen: { width: number; height: number };
  timezone: string;
  languages: string[];
}

export interface BehaviorPayload {
  mouse_moves: MouseMove[];
  clicks: ClickEvent[];
  key_intervals: number[];
  scrolled: boolean;
  env: EnvInfo;
  page_load_to_checkbox: number;
  session_id: string;
  timestamp: string;
}

// ── UUID 생성 (HTTP 환경 폴백 포함) ───────────────
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // HTTP 환경 폴백 (crypto.randomUUID는 HTTPS/localhost에서만 동작)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Canvas 핑거프린트 ──────────────────────────────
function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PartyUp', 2, 15);
    const dataUrl = canvas.toDataURL();
    // simple hash
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(16);
  } catch {
    return 'canvas-error';
  }
}

// ── WebGL Renderer ─────────────────────────────────
function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      'WEBGL_debug_renderer_info',
    );
    if (!debugInfo) return 'no-debug-info';
    return (
      (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL,
      ) || 'unknown'
    );
  } catch {
    return 'webgl-error';
  }
}

// ── 환경 정보 수집 ─────────────────────────────────
function collectEnvInfo(): EnvInfo {
  return {
    webdriver: !!(navigator as any).webdriver,
    plugins_count: navigator.plugins?.length ?? 0,
    canvas_hash: getCanvasHash(),
    webgl_renderer: getWebGLRenderer(),
    screen: { width: screen.width, height: screen.height },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: [...navigator.languages],
  };
}

// ── 메인 훅 ────────────────────────────────────────
const MAX_MOUSE_POINTS = 500; // CONTEXT.md: 최대 500포인트

export function useBehaviorCollector() {
  const sessionId = useRef(generateUUID()); // ← 수정된 부분
  const pageLoadTime = useRef(Date.now());

  const mouseMoves = useRef<MouseMove[]>([]);
  const clicks = useRef<ClickEvent[]>([]);
  const keyIntervals = useRef<number[]>([]);
  const lastKeyTime = useRef<number | null>(null);
  const scrolled = useRef(false);
  const envInfo = useRef<EnvInfo | null>(null);

  useEffect(() => {
    // 환경 정보는 마운트 시 1회 수집
    envInfo.current = collectEnvInfo();

    const onMouseMove = (e: MouseEvent) => {
      if (mouseMoves.current.length >= MAX_MOUSE_POINTS) return;
      mouseMoves.current.push({
        x: e.clientX,
        y: e.clientY,
        t: Date.now() - pageLoadTime.current,
      });
    };

    const onClick = (e: MouseEvent) => {
      const target =
        (e.target as HTMLElement)?.tagName?.toLowerCase() ?? 'unknown';
      clicks.current.push({
        x: e.clientX,
        y: e.clientY,
        t: Date.now() - pageLoadTime.current,
        target,
      });
    };

    const onKeyDown = () => {
      // 키 값(문자)은 절대 안 보냄 (비밀번호 등 민감정보 보호)
      const now = Date.now();
      if (lastKeyTime.current !== null) {
        keyIntervals.current.push(now - lastKeyTime.current);
      }
      lastKeyTime.current = now;
    };

    const onScroll = () => {
      scrolled.current = true;
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('click', onClick, { passive: true });
    document.addEventListener('keydown', onKeyDown, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  /** 체크박스 클릭 시 호출 → 수집된 행동 데이터 반환 */
  const collectPayload = useCallback((): BehaviorPayload => {
    return {
      mouse_moves: [...mouseMoves.current],
      clicks: [...clicks.current],
      key_intervals: [...keyIntervals.current],
      scrolled: scrolled.current,
      env: envInfo.current ?? collectEnvInfo(),
      page_load_to_checkbox: Date.now() - pageLoadTime.current,
      session_id: sessionId.current,
      timestamp: new Date().toISOString(),
    };
  }, []);

  return { collectPayload, sessionId: sessionId.current };
}