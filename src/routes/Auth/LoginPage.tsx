import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  FormControlLabel,
  Checkbox,
  Grid,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { colors } from "../../theme";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log("로그인 시뮬레이션 (입력값 무시)...");
    const fakeToken = "fake-jwt-token-" + Date.now();
    login(fakeToken);
    navigate("/");
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 70%, ${colors.accent} 100%)`,
        padding: { xs: 2, sm: 3 },
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            padding: { xs: 3, sm: 5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
            backgroundColor: "rgba(255, 255, 255, 1)",
            boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
            <BusinessIcon fontSize="large" />
          </Avatar>
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 1, fontWeight: "bold" }}
          >
            Manezy 로그인
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            매장 관리를 위한 첫 걸음
          </Typography>
          <Box
            component="form"
            onSubmit={handleLogin}
            noValidate
            sx={{ mt: 1, width: "100%" }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
                {error}
              </Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="이메일 주소"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com (테스트용)"
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: 2 },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password (테스트용)"
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            <Grid
              container
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1, mb: 2 }}
            >
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox value="remember" color="primary" size="small" />
                  }
                  label={
                    <Typography variant="body2">로그인 상태 유지</Typography>
                  }
                  sx={{
                    ".MuiFormControlLabel-label": { fontSize: "0.875rem" },
                  }}
                />
              </Grid>
              <Grid item>
                <Link
                  component={RouterLink}
                  to="#"
                  variant="body2"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                boxShadow: "0 4px 15px rgba(64, 80, 181, 0.4)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(64, 80, 181, 0.5)",
                },
              }}
            >
              로그인
            </Button>
            <Grid container justifyContent="center">
              <Grid item>
                <Typography variant="body2">
                  계정이 없으신가요?{" "}
                  <Link
                    component={RouterLink}
                    to="/signup"
                    variant="body2"
                    sx={{ fontWeight: "bold" }}
                  >
                    회원가입
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
