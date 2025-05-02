import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Paper,
} from "@mui/material";

const KakaoCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processKakaoLogin = async () => {
      const code = new URLSearchParams(location.search).get("code");

      if (!code) {
        console.error("카카오 인증 코드가 없습니다");
        setError("인증 코드가 없습니다. 다시 로그인해 주세요.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        console.log(`카카오 인증 코드 수신: ${code.substring(0, 10)}...`);
        const response = await authService.kakaoLogin(code);

        // 로그인 성공 처리
        login(response.token, response.user);
        console.log("카카오 로그인 성공");

        // 대시보드로 이동
        navigate("/dashboard");
      } catch (error: any) {
        console.error("카카오 로그인 처리 중 오류:", error);

        // 오류 메시지 설정
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.response?.status === 400) {
          setError("잘못된 요청입니다. 다시 로그인해 주세요.");
        } else if (error.response?.status === 401) {
          setError("카카오 로그인 인증에 실패했습니다.");
        } else if (error.response?.status === 404) {
          setError("연결된 계정을 찾을 수 없습니다. 먼저 회원가입을 해주세요.");
          setTimeout(() => navigate("/signup"), 3000);
          return;
        } else if (error.code === "ECONNABORTED") {
          setError(
            "서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
          );
        } else {
          setError(
            "카카오 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요."
          );
        }

        // 오류 발생 시 3초 후 로그인 페이지로 이동
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    processKakaoLogin();
  }, [location, navigate, login]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
        {error ? (
          <Box>
            <Typography variant="h5" color="error" gutterBottom>
              로그인 오류
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              잠시 후 로그인 페이지로 이동합니다...
            </Typography>
          </Box>
        ) : (
          <Box>
            <CircularProgress size={50} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              카카오 로그인 처리 중
            </Typography>
            <Typography variant="body1" color="text.secondary">
              잠시만 기다려 주세요...
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default KakaoCallback;
