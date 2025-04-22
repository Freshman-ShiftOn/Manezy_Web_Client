import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginRequest, authService } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { LS_KEYS } from "../../services/api";

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "error"
  );

  // URL에서 카카오 인증 코드 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const kakaoCode = urlParams.get("code");

    if (kakaoCode) {
      handleKakaoLogin(kakaoCode);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setSnackbarMessage("이메일과 비밀번호를 모두 입력해주세요.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("로그인 시도 중...");
      const response = await authService.login(formData);

      // 로그인 성공 처리
      login(response.token, response.user);

      // 성공 메시지
      setSnackbarMessage("로그인에 성공했습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 지점 설정 확인
      const storeData = localStorage.getItem(LS_KEYS.STORE);
      const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);

      // 잠시 후 적절한 페이지로 이동
      setTimeout(() => {
        if (!storeData || !setupComplete) {
          // 지점 설정이 없으면 설정 마법사로 이동
          console.log("지점 설정이 필요합니다. 설정 마법사로 이동합니다.");
          navigate("/setup/wizard");
        } else {
          // 지점 설정이 있으면 대시보드로 이동
          console.log("지점 설정이 완료되었습니다. 대시보드로 이동합니다.");
          navigate("/dashboard");
        }
      }, 1000);
    } catch (error: any) {
      console.error("Login error:", error);

      // 서버가 응답한 에러 메시지가 있으면 표시
      if (error.response?.data?.message) {
        setSnackbarMessage(error.response.data.message);
      } else if (error.response?.status === 401) {
        setSnackbarMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else if (error.response?.status === 404) {
        setSnackbarMessage("존재하지 않는 계정입니다.");
      } else if (error.response?.status === 403) {
        setSnackbarMessage("계정이 잠겨 있습니다.");
      } else if (error.code === "ECONNABORTED") {
        setSnackbarMessage(
          "서버 응답 시간이 초과되었습니다. 나중에 다시 시도해주세요."
        );
      } else if (!error.response && error.request) {
        setSnackbarMessage(
          "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요."
        );
      } else {
        setSnackbarMessage(
          "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요."
        );
      }

      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async (code: string) => {
    setLoading(true);

    try {
      console.log("카카오 로그인 시도 중...");
      const response = await authService.kakaoLogin(code);

      // 로그인 성공 처리
      login(response.token, response.user);

      // 성공 메시지
      setSnackbarMessage("카카오 로그인에 성공했습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 지점 설정 확인
      const storeData = localStorage.getItem(LS_KEYS.STORE);
      const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);

      // 잠시 후 적절한 페이지로 이동
      setTimeout(() => {
        if (!storeData || !setupComplete) {
          // 지점 설정이 없으면 설정 마법사로 이동
          console.log("지점 설정이 필요합니다. 설정 마법사로 이동합니다.");
          navigate("/setup/wizard");
        } else {
          // 지점 설정이 있으면 대시보드로 이동
          console.log("지점 설정이 완료되었습니다. 대시보드로 이동합니다.");
          navigate("/dashboard");
        }
      }, 1000);
    } catch (error: any) {
      console.error("Kakao login error:", error);

      // 서버가 응답한 에러 메시지가 있으면 표시
      if (error.response?.data?.message) {
        setSnackbarMessage(error.response.data.message);
      } else if (error.response?.status === 401) {
        setSnackbarMessage("카카오 로그인 인증에 실패했습니다.");
      } else if (error.response?.status === 404) {
        setSnackbarMessage(
          "연결된 계정을 찾을 수 없습니다. 먼저 회원가입을 해주세요."
        );
      } else if (error.code === "ECONNABORTED") {
        setSnackbarMessage(
          "서버 응답 시간이 초과되었습니다. 나중에 다시 시도해주세요."
        );
      } else if (!error.response && error.request) {
        setSnackbarMessage(
          "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요."
        );
      } else {
        setSnackbarMessage("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
      }

      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLoginClick = () => {
    // 카카오 로그인 페이지로 리디렉션
    console.log("카카오 로그인 버튼 클릭");
    const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID;
    const REDIRECT_URI =
      process.env.REACT_APP_KAKAO_REDIRECT_URI ||
      `${window.location.origin}/auth/kakao/callback`;

    console.log("카카오 로그인 설정:", { KAKAO_CLIENT_ID, REDIRECT_URI });

    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code`;
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Manezy
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            매장 관리의 모든 것, 마네지
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            name="email"
            label="이메일"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          />
          <TextField
            name="password"
            label="비밀번호"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "로그인"}
          </Button>
        </form>

        <Box sx={{ textAlign: "center", my: 1 }}>
          <Link href="/signup" underline="hover">
            계정이 없으신가요? 회원가입
          </Link>
        </Box>

        <Divider sx={{ my: 3 }}>또는</Divider>

        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          sx={{
            py: 1.5,
            bgcolor: "#FEE500",
            color: "#000",
            borderColor: "#FEE500",
            "&:hover": {
              bgcolor: "#E6CF00",
              borderColor: "#E6CF00",
            },
          }}
          onClick={handleKakaoLoginClick}
          disabled={loading}
        >
          카카오 계정으로 로그인
        </Button>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LoginPage;
