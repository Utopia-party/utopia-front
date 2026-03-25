import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { api } from "../libs/api";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const checkLoginStatus = async () => {
    try {
      const response = await api.get("/me");
      setIsLoggedIn(response.data?.is_logged_in === true);
    } catch (error) {
      console.error("로그인 상태 확인 실패", error);
      setIsLoggedIn(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    const publicPaths = ["/login", "/signup"];

    if (publicPaths.includes(location.pathname)) {
      setIsLoggedIn(false);
      setIsCheckingAuth(false);
      return;
    }

    checkLoginStatus();

    const handleAuthChanged = () => {
      checkLoginStatus();
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    // access token 만료 감지를 위해 주기적으로 로그인 상태 재확인
    const intervalId = window.setInterval(() => {
      checkLoginStatus();
    }, 60 * 1000); // 1분마다 체크

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
      window.clearInterval(intervalId);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("로그아웃 요청 실패", error);
    } finally {
      setIsLoggedIn(false);
      setIsCheckingAuth(false);
      window.dispatchEvent(new Event("auth-changed"));
      alert("로그아웃 되었습니다.");
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="flex h-16 items-center justify-end border-b-2 border-gray-200 bg-card px-8">
      {isCheckingAuth ? null : isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          로그아웃
        </button>
      ) : (
        <Link
          to="/login"
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          로그인
        </Link>
      )}
    </header>
  );
}