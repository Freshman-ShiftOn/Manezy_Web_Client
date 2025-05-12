import apiClient from './index';

/**
 * 카카오 인증 관련 API 함수들
 */

/**
 * 카카오 인증 코드로 액세스 토큰 요청
 * @param code 카카오 인증 코드
 * @returns 서버 응답 (액세스 토큰, 리프레시 토큰 등)
 */
export const getKakaoToken = async (code: string) => {
  try {
    const response = await apiClient.get('/auth/kakao/web/login', {
      params: {code: code},
      headers: {
        "Content-Type": "text/plain",
      },
    });

    console.log(response);
    
    // 토큰 저장
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      localStorage.setItem('isLoggedIn', 'true');
    }
    
    return response.data;
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    throw error;
  }
};

/**
 * 카카오 로그아웃
 */
export const logoutKakao = async () => {
  try {
    await apiClient.post('/api/auth/logout');
    
    // 로컬 스토리지에서 인증 정보 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    
    return true;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    
    // 오류가 발생해도 로컬 스토리지는 비움
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    
    throw error;
  }
};

/**
 * 카카오 사용자 정보 조회
 */
export const getKakaoUserInfo = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw error;
  }
}; 