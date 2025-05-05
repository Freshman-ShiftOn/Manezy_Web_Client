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
  FormControlLabel,
  Checkbox,
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

  const [rememberEmail, setRememberEmail] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "error"
  );

  useEffect(() => {
    const savedEmail = localStorage.getItem(LS_KEYS.REMEMBERED_EMAIL);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRememberEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRememberEmail(event.target.checked);
  };

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

      if (rememberEmail) {
        localStorage.setItem(LS_KEYS.REMEMBERED_EMAIL, formData.email);
        console.log("아이디 저장됨:", formData.email);
      } else {
        localStorage.removeItem(LS_KEYS.REMEMBERED_EMAIL);
        console.log("저장된 아이디 제거됨");
      }

      login(response.token, response.user);

      setSnackbarMessage("로그인에 성공했습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      const storeData = localStorage.getItem(LS_KEYS.STORE);
      const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);

      setTimeout(() => {
        if (!storeData || !setupComplete) {
          console.log("지점 설정이 필요합니다. 설정 마법사로 이동합니다.");
          navigate("/setup/wizard");
        } else {
          console.log("지점 설정이 완료되었습니다. 대시보드로 이동합니다.");
          navigate("/dashboard");
        }
      }, 1000);
    } catch (error: any) {
      console.error("Login error:", error);

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

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberEmail}
                onChange={handleRememberEmailChange}
                name="rememberEmail"
                color="primary"
              />
            }
            label="아이디 저장"
            sx={{ mt: 1, mb: 1 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, py: 1.5, fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "로그인"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            계정이 없으신가요?{" "}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/signup")}
              sx={{ fontWeight: "bold" }}
            >
              회원가입
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
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LoginPage;
