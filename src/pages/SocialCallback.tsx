import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import { api } from "../libs/api";

type SocialLoginResponse =
  | {
      status: "NEED_NICKNAME";
      oauth: string;
      oauth_id: string;
      email: string | null;
      name: string | null;
    }
  | {
      status?: "LOGIN_SUCCESS" | "SIGNUP_SUCCESS";
      message?: string;
      user?: {
        email: string;
        nickname: string;
        name: string;
      };
    };

const supportedProviders = ["google", "kakao", "naver"] as const;

export default function SocialCallback() {
  const navigate = useNavigate();
  const { provider } = useParams();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const handleSocialCallback = async () => {
      const oauth = (provider || "").toLowerCase();

      if (!supportedProviders.includes(oauth as (typeof supportedProviders)[number])) {
        alert("지원하지 않는 소셜 로그인 경로입니다.");
        navigate("/login", { replace: true });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      const errorDescription =
        params.get("error_description") || params.get("error_message");

      if (error) {
        alert(errorDescription || `${oauth} 로그인 실패`);
        navigate("/login", { replace: true });
        return;
      }

      if (!code) {
        alert("인가코드를 찾을 수 없습니다.");
        navigate("/login", { replace: true });
        return;
      }

      const storageKey = `${oauth}_oauth_state`;
      const savedState = sessionStorage.getItem(storageKey);

      if (!state) {
        alert("state 값이 없습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
        return;
      }

      if (!savedState || state !== savedState) {
        alert("잘못된 로그인 요청입니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const payload: { oauth: string; code: string; state?: string } = {
          oauth,
          code,
          state,
        };

        // ✅ baseURL이 이미 /api를 포함하므로 /auth/login만 사용
        const response = await api.post<SocialLoginResponse>(
          "/auth/login",
          payload
        );

        const data = response.data;

        if (data.status === "NEED_NICKNAME") {
          const userNickname = prompt("서비스에서 사용할 닉네임을 입력해주세요!");

          if (!userNickname || !userNickname.trim()) {
            alert("닉네임 입력이 필요합니다.");
            navigate("/login", { replace: true });
            return;
          }

          await api.post("/auth/social/signup", {
            oauth: data.oauth,
            oauth_id: data.oauth_id,
            email: data.email,
            name: data.name,
            nickname: userNickname.trim(),
          });

          sessionStorage.removeItem(storageKey);
          window.dispatchEvent(new Event("auth-changed"));
          alert(`${oauth} 로그인에 성공했습니다!`);
          navigate("/", { replace: true });
          return;
        }

        sessionStorage.removeItem(storageKey);
        window.dispatchEvent(new Event("auth-changed"));
        window.history.replaceState({}, document.title, "/");
        alert(`${oauth} 로그인에 성공했습니다!`);
        navigate("/", { replace: true });
      } catch (error: unknown) {
        sessionStorage.removeItem(storageKey);

        if (axios.isAxiosError(error)) {
          alert(error.response?.data?.detail || `${oauth} 로그인 실패`);
        } else if (error instanceof Error) {
          alert(error.message);
        } else {
          alert(`${oauth} 로그인 실패`);
        }

        navigate("/login", { replace: true });
      }
    };

    handleSocialCallback();
  }, [navigate, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-sm text-muted-foreground">소셜 로그인 처리 중...</p>
      </div>
    </div>
  );
}
