import React, { useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { SignupRequest, authService } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";

const SignupPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<SignupRequest>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "error"
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    // 이메일 유효성 검사
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setSnackbarMessage("유효한 이메일 주소를 입력해주세요.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    // 비밀번호 유효성 검사
    if (!formData.password || formData.password.length < 6) {
      setSnackbarMessage("비밀번호는 최소 6자 이상이어야 합니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    // 비밀번호 확인 일치 검사
    if (formData.password !== formData.confirmPassword) {
      setSnackbarMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    // 이름 유효성 검사
    if (!formData.name || formData.name.trim().length < 2) {
      setSnackbarMessage("이름을 2자 이상 입력해주세요.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("회원가입 시도 중...");
      const response = await authService.signup(formData);

      // 회원가입 성공 메시지
      setSnackbarMessage("회원가입이 완료되었습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 토큰이 유효하지 않거나 빈 값인 경우 (백엔드 응답 문제)
      if (!response.token) {
        console.log("유효하지 않은 토큰, 로그인 페이지로 리다이렉트");

        // 잠시 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate("/login");
        }, 1500);
        return;
      }

      // 토큰이 유효한 경우 로그인 처리
      login(response.token, response.user);

      // 지점 설정이 필요하면 설정 마법사로 이동
      setTimeout(() => {
        navigate("/setup/wizard");
      }, 1500);
    } catch (error: any) {
      console.error("Signup error:", error);

      // 서버가 응답한 에러 메시지가 있으면 표시
      if (error.response?.data?.message) {
        setSnackbarMessage(error.response.data.message);
      } else if (error.response?.status === 409) {
        setSnackbarMessage("이미 등록된 이메일 주소입니다.");
      } else if (error.response?.status === 400) {
        setSnackbarMessage(
          "입력한 정보가 유효하지 않습니다. 다시 확인해주세요."
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
        setSnackbarMessage("회원가입에 실패했습니다. 다시 시도해주세요.");
      }

      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            회원가입
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manezy 계정 생성하기
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
            name="name"
            label="이름"
            value={formData.name}
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
            helperText="비밀번호는 최소 6자 이상이어야 합니다"
          />
          <TextField
            name="confirmPassword"
            label="비밀번호 확인"
            type="password"
            value={formData.confirmPassword}
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
            {loading ? <CircularProgress size={24} /> : "회원가입"}
          </Button>
        </form>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body2">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" underline="hover">
              로그인
            </Link>
          </Typography>
        </Box>
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

export default SignupPage;
