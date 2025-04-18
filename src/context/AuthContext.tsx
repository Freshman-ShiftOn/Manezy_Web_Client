import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { LS_KEYS } from "../services/api";

// 사용자 정보 인터페이스
export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 초기 로딩 시 localStorage에서 토큰과 사용자 정보 확인
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(LS_KEYS.AUTH_TOKEN)
  );

  const [user, setUser] = useState<User | null>(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  const login = useCallback((token: string, userData: User) => {
    // 토큰 및 사용자 정보 저장
    localStorage.setItem(LS_KEYS.AUTH_TOKEN, token);
    localStorage.setItem("user", JSON.stringify(userData));

    // 상태 업데이트
    setIsAuthenticated(true);
    setUser(userData);

    console.log("User logged in:", userData.email);
  }, []);

  const updateUser = useCallback((userData: User) => {
    // 사용자 정보 업데이트
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    console.log("User profile updated:", userData.name);
  }, []);

  const logout = useCallback(() => {
    // 토큰 및 사용자 정보 제거
    localStorage.removeItem(LS_KEYS.AUTH_TOKEN);
    localStorage.removeItem("user");

    // 상태 업데이트
    setIsAuthenticated(false);
    setUser(null);

    console.log("User logged out");
  }, []);

  // 인증 상태 변경 감지
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
      setIsAuthenticated(!!token);

      if (!token) {
        setUser(null);
      }
    };

    // 다른 탭에서 로그인/로그아웃 감지
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
