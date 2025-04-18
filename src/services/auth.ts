import { LS_KEYS } from "./api";
import axios, { AxiosError } from "axios";

// API 기본 URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://epicode.co.kr";

// HTTP 클라이언트 설정
const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // 타임아웃 설정 - 10초
  timeout: 10000,
  // credentials 설정
  withCredentials: false,
});

// 요청 인터셉터 설정 - 인증 토큰 주입 및 로깅
authClient.interceptors.request.use(
  (config) => {
    // 로그 시작
    console.log(
      `🚀 API 요청: [${config.method?.toUpperCase()}] ${config.baseURL}${
        config.url
      }`
    );

    if (config.params) {
      console.log("요청 파라미터:", config.params);
    }

    if (config.data) {
      console.log("요청 데이터:", config.data);
    }

    // 헤더 설정
    const token = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("인증 토큰 포함됨");
    }

    console.log("요청 헤더:", config.headers);

    return config;
  },
  (error) => {
    console.error("❌ 요청 전송 오류:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정 - 응답 로깅 및 401 처리
authClient.interceptors.response.use(
  (response) => {
    // 응답 성공 로깅
    console.log(`✅ 응답 성공: [${response.status}] ${response.config.url}`);
    console.log("응답 데이터:", response.data);

    return response;
  },
  (error) => {
    // 응답 오류 로깅
    if (error.response) {
      // 서버가 응답을 반환한 경우
      console.error(
        `❌ 응답 오류: [${error.response.status}] ${error.config?.url}`
      );
      console.error("오류 데이터:", error.response.data);
      console.error("오류 헤더:", error.response.headers);

      // 401 Unauthorized 처리
      if (error.response.status === 401) {
        console.warn("인증 만료 또는 유효하지 않은 토큰");
        localStorage.removeItem(LS_KEYS.AUTH_TOKEN);
        window.location.href = "/login";
      }
    } else if (error.request) {
      // 요청은 전송되었지만 응답이 없는 경우
      console.error("❌ 응답 없음:", error.request);
      console.error("요청 데이터:", error.config?.data);
      console.error("요청 URL:", error.config?.url);
      console.error("요청 타임아웃:", error.code === "ECONNABORTED");
    } else {
      // 요청 설정 중 오류 발생
      console.error("❌ 요청 설정 오류:", error.message);
    }

    return Promise.reject(error);
  }
);

// axios 에러 상세 로깅 유틸리티
const logAxiosError = (
  error: AxiosError,
  prefix: string = "API 오류"
): void => {
  console.group(`${prefix}: ${error.message}`);

  // 요청 정보
  if (error.config) {
    console.log("요청 메서드:", error.config.method?.toUpperCase());
    console.log("요청 URL:", error.config.baseURL + error.config.url);

    if (error.config.params) {
      console.log("요청 파라미터:", error.config.params);
    }

    if (error.config.data) {
      try {
        console.log(
          "요청 데이터:",
          typeof error.config.data === "string"
            ? JSON.parse(error.config.data)
            : error.config.data
        );
      } catch (e) {
        console.log("요청 데이터(파싱 불가):", error.config.data);
      }
    }

    // 헤더 정보 (인증 토큰 숨김)
    const headers = { ...error.config.headers };
    if (headers.Authorization) {
      headers.Authorization = "Bearer [HIDDEN]";
    }
    console.log("요청 헤더:", headers);
  }

  // 응답 정보
  if (error.response) {
    console.log("상태 코드:", error.response.status);
    console.log("상태 텍스트:", error.response.statusText);
    console.log("응답 데이터:", error.response.data);
    console.log("응답 헤더:", error.response.headers);
  } else if (error.request) {
    console.log("요청은 전송되었으나 응답 없음");
    console.log("타임아웃 여부:", error.code === "ECONNABORTED");
  }

  console.log("전체 에러 객체:", error);
  console.groupEnd();
};

// 인터페이스 정의
export interface SignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateNameRequest {
  name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// 인증 서비스
export const authService = {
  // 카카오 로그인
  kakaoLogin: async (code: string): Promise<AuthResponse> => {
    try {
      console.log(`카카오 로그인 시도 - 인증 코드: ${code.substring(0, 8)}...`);

      const response = await authClient.get(
        `/api/web/auth/kakao/login?code=${code}`
      );
      const token = response.data;

      if (!token) {
        throw new Error("토큰이 응답에 없습니다.");
      }

      console.log("카카오 로그인 성공, 토큰 저장됨");
      // 토큰 저장
      localStorage.setItem(LS_KEYS.AUTH_TOKEN, token);

      // 사용자 정보 조회
      console.log("사용자 정보 요청 중...");
      const userResponse = await authClient.get("/api/users/me");
      console.log("사용자 정보 조회 성공");

      return {
        token,
        user: userResponse.data,
      };
    } catch (error: any) {
      console.error("카카오 로그인 오류:", error.message);
      if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "카카오 로그인 오류");
      }
      throw error;
    }
  },

  // 회원가입
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    try {
      console.log("회원가입 시도:", { email: data.email, name: data.name });

      const response = await authClient.post("/api/web/auth/signup", data);
      const token = response.data;

      if (!token) {
        throw new Error("회원가입 성공했으나 토큰이 응답에 없습니다.");
      }

      console.log("회원가입 성공, 토큰 저장됨");
      // 토큰 저장
      localStorage.setItem(LS_KEYS.AUTH_TOKEN, token);

      // 사용자 정보 조회
      console.log("사용자 정보 요청 중...");
      const userResponse = await authClient.get("/api/users/me");
      console.log("사용자 정보 조회 성공");

      return {
        token,
        user: userResponse.data,
      };
    } catch (error: any) {
      console.error("회원가입 오류:", error.message);
      if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "회원가입 오류");
      }
      throw error;
    }
  },

  // 로그인
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log("로그인 시도:", { email: data.email });

      const response = await authClient.post("/api/web/auth/login", data);
      const token = response.data;

      if (!token) {
        throw new Error("로그인 성공했으나 토큰이 응답에 없습니다.");
      }

      console.log("로그인 성공, 토큰 저장됨");
      // 토큰 저장
      localStorage.setItem(LS_KEYS.AUTH_TOKEN, token);

      // 사용자 정보 조회
      console.log("사용자 정보 요청 중...");
      const userResponse = await authClient.get("/api/users/me");
      console.log("사용자 정보 조회 성공");

      return {
        token,
        user: userResponse.data,
      };
    } catch (error: any) {
      console.error("로그인 오류:", error.message);
      if (error.response?.status === 401) {
        console.error("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "로그인 오류");
      }
      throw error;
    }
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    try {
      console.log("로그아웃 요청 중...");
      await authClient.post("/signout");
      console.log("로그아웃 성공");
      localStorage.removeItem(LS_KEYS.AUTH_TOKEN);
    } catch (error: any) {
      console.error("로그아웃 오류:", error.message);
      // 오류가 발생해도 로컬에서는 로그아웃 처리
      localStorage.removeItem(LS_KEYS.AUTH_TOKEN);
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "로그아웃 오류");
      }
      throw error;
    }
  },

  // 사용자 정보 수정 (이름)
  updateName: async (name: string): Promise<void> => {
    try {
      console.log(`사용자 이름 변경 시도: ${name}`);
      const userId = await authService.getCurrentUserId();
      console.log(`현재 사용자 ID: ${userId}`);

      await authClient.put(`/edit/${name}`, null, {
        headers: {
          "X-Authenticated-User-Id": userId,
        },
      });
      console.log("사용자 이름 변경 성공");
    } catch (error: any) {
      console.error("사용자 이름 변경 오류:", error.message);
      if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "사용자 이름 변경 오류");
      }
      throw error;
    }
  },

  // 회원 탈퇴
  deleteAccount: async (email: string): Promise<void> => {
    try {
      console.log(`회원 탈퇴 시도: ${email}`);
      await authClient.delete(`/signout?email=${email}`);
      console.log("회원 탈퇴 성공");
      localStorage.removeItem(LS_KEYS.AUTH_TOKEN);
    } catch (error: any) {
      console.error("회원 탈퇴 오류:", error.message);
      if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "회원 탈퇴 오류");
      }
      throw error;
    }
  },

  // 현재 로그인된 사용자 ID 조회
  getCurrentUserId: async (): Promise<string> => {
    try {
      console.log("현재 사용자 ID 조회 중...");
      const response = await authClient.get("/api/users/me");
      console.log(`사용자 ID 조회 성공: ${response.data.id}`);
      return response.data.id;
    } catch (error: any) {
      console.error("사용자 ID 조회 오류:", error.message);
      if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "사용자 ID 조회 오류");
      }
      throw error;
    }
  },

  // 현재 로그인된 사용자 정보 조회
  getCurrentUser: async () => {
    try {
      console.log("현재 사용자 정보 조회 중...");
      const response = await authClient.get("/api/users/me");
      console.log("사용자 정보 조회 성공:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("사용자 정보 조회 오류:", error.message);
      if (error.response?.data?.message) {
        console.error("서버 오류 메시지:", error.response.data.message);
      }
      if (axios.isAxiosError(error)) {
        logAxiosError(error, "사용자 정보 조회 오류");
      }
      throw error;
    }
  },

  // 로그인 상태 확인
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(LS_KEYS.AUTH_TOKEN);
  },
};

export default authService;
