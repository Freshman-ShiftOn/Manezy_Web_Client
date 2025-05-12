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
import axios, { AxiosError } from "axios";

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
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("error");

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

  const handleRememberEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      console.log("로그인 시도 중...", formData);
      const response = await authService.login(formData);
      console.log("로그인 응답:", response);

      if (rememberEmail) {
        localStorage.setItem(LS_KEYS.REMEMBERED_EMAIL, formData.email);
      } else {
        localStorage.removeItem(LS_KEYS.REMEMBERED_EMAIL);
      }

      login(response.token, response.user);

      setSnackbarMessage("로그인에 성공했습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      const storeData = localStorage.getItem(LS_KEYS.STORE);
      const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);

      // 즉시 리다이렉션
      if (!storeData || !setupComplete) {
        navigate("/setup/wizard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);

      let displayMessage = "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        switch (status) {
          case 401:
            displayMessage = "아이디 또는 비밀번호가 일치하지 않습니다.";
            break;
          case 404:
            displayMessage = "가입되지 않은 사용자입니다. 회원가입을 진행해주세요.";
            break;
          case 403:
            displayMessage = "접근 권한이 없거나 계정이 잠겨 있습니다.";
            break;
          case 500:
            displayMessage = "서버 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.";
            break;
          default:
            if (serverMessage) {
              displayMessage = serverMessage;
            }
            break;
        }
      } else if (error instanceof Error) {
        displayMessage = error.message;
      }

      setSnackbarMessage(displayMessage);
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
