import axios from 'axios';
import { apiClient } from './client';
import { storeApi } from './store.api';
import { LS_KEYS } from './constants';

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// axios 인스턴스 생성
const apiClientInstance = axios.create({
baseURL: API_BASE_URL,
headers: {
    'Content-Type': 'application/json',
},
timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 토큰이 있으면 헤더에 추가
apiClientInstance.interceptors.request.use(
(config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
(error) => {
    return Promise.reject(error);
}
);

// 응답 인터셉터 - 에러 처리
apiClientInstance.interceptors.response.use(
(response) => {
    return response;
},
async (error) => {
    const originalRequest = error.config;
    
    // 401 에러 (인증 실패) 및 토큰 갱신 시도 안된 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
        // 리프레시 토큰으로 새 액세스 토큰 요청 로직
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return Promise.reject(error);
        }
        
        // 토큰 갱신 요청
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
        });
        
        // 새 토큰 저장
        const { accessToken } = response.data as { accessToken: string };
        localStorage.setItem('accessToken', accessToken);
        
        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClientInstance(originalRequest);
    } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/login';
        return Promise.reject(refreshError);
    }
    }
    
    return Promise.reject(error);
}
);

export { apiClient } from './client';
export { storeApi } from './store.api';
export { LS_KEYS } from './constants'; 