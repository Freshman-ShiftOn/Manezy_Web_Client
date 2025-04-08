import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./routes/Dashboard/DashboardPage";
import SchedulePage from "./routes/Schedule/SchedulePage";
import EmployeePage from "./routes/Employees/EmployeePage";
import PayrollPage from "./routes/Payroll/PayrollPage";
import StoreSettingsPage from "./routes/Settings/StoreSettingsPage";
import {
  hasInitialSetup,
  getStoreInfo,
  generateDummyData,
} from "./services/api";
import {
  CircularProgress,
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  Grid,
  Button,
  CssBaseline,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { CalendarMonth, Group, Payment } from "@mui/icons-material";
import { appTheme, colors } from "./theme";

// 로그인 상태 관리를 위한 간단한 컨텍스트(실제 앱에선 별도 파일로 분리)
export const AuthContext = React.createContext<{
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
}>({
  isLoggedIn: false,
  setLoggedIn: () => {},
});

// 임시 로그인 페이지 (로그인 후 이동 경로 변경)
const LoginPage = () => {
  const navigate = useNavigate();
  const { setLoggedIn } = React.useContext(AuthContext);

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setLoggedIn(true);
    navigate("/"); // 로그인 후 메인 페이지(/)로 이동
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        background: `linear-gradient(135deg, ${colors.accent} 0%, #ffffff 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(64, 80, 181, 0.05) 0%, transparent 20%),
             radial-gradient(circle at 90% 30%, rgba(96, 112, 255, 0.07) 0%, transparent 20%),
             radial-gradient(circle at 30% 70%, rgba(64, 80, 181, 0.05) 0%, transparent 30%),
             radial-gradient(circle at 70% 80%, rgba(96, 112, 255, 0.07) 0%, transparent 20%)`,
          animation: "backgroundShift 30s ease infinite alternate",
          zIndex: 0,
        },
        "@keyframes backgroundShift": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" },
        },
      }}
    >
      {/* 움직이는 배경 도형들 */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* 상단 왼쪽 도형 */}
        <Box
          sx={{
            position: "absolute",
            top: "-50px",
            left: "-50px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: `linear-gradient(45deg, ${colors.primary}22, ${colors.secondary}11)`,
            animation: "float1 15s ease-in-out infinite",
            "@keyframes float1": {
              "0%": { transform: "translate(0, 0) rotate(0deg)" },
              "50%": { transform: "translate(20px, 20px) rotate(5deg)" },
              "100%": { transform: "translate(0, 0) rotate(0deg)" },
            },
          }}
        />

        {/* 우측 도형 */}
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            right: "-100px",
            width: "300px",
            height: "300px",
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
            background: `linear-gradient(45deg, ${colors.secondary}11, ${colors.primary}22)`,
            animation: "float2 20s ease-in-out infinite",
            "@keyframes float2": {
              "0%": { transform: "translate(0, 0) rotate(0deg)" },
              "50%": { transform: "translate(-20px, 30px) rotate(-5deg)" },
              "100%": { transform: "translate(0, 0) rotate(0deg)" },
            },
          }}
        />

        {/* 하단 도형 */}
        <Box
          sx={{
            position: "absolute",
            bottom: "-100px",
            left: "30%",
            width: "250px",
            height: "250px",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
            background: `linear-gradient(45deg, ${colors.primary}11, ${colors.accent})`,
            animation: "float3 25s ease-in-out infinite",
            "@keyframes float3": {
              "0%": { transform: "translate(0, 0) rotate(0deg)" },
              "50%": { transform: "translate(30px, -20px) rotate(5deg)" },
              "100%": { transform: "translate(0, 0) rotate(0deg)" },
            },
          }}
        />
      </Box>

      {/* 상단 로고 부분 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pt: { xs: 6, md: 10 },
          pb: { xs: 4, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            animation: "pulse 3s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.05)" },
              "100%": { transform: "scale(1)" },
            },
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            width="120"
            height="120"
          >
            <circle cx="100" cy="100" r="90" fill="#f0f4ff" />
            <path
              d="M55 50 L55 150 L75 150 L75 90 L100 125 L125 90 L125 150 L145 150 L145 50 L125 50 L100 90 L75 50 Z"
              fill={colors.primary}
            />
            <rect
              x="50"
              y="160"
              width="100"
              height="8"
              rx="4"
              fill={colors.secondary}
            />
          </svg>
        </Box>
      </Box>

      {/* 메인 콘텐츠 */}
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 2,
            mb: 4,
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Manezy
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
              }}
            >
              매장 근무 시간 관리 솔루션
            </Typography>
            <Divider sx={{ mb: 4, width: "50%", mx: "auto" }} />
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              Manezy로 매장의 근무 스케줄을 더 효율적으로 관리하세요. 스케줄
              작성, 변경, 대타 관리를 손쉽게 할 수 있습니다.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                mt: 2,
                px: 4,
                py: 1.5,
                position: "relative",
                overflow: "hidden",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "100%",
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  transition: "0.5s",
                },
                "&:hover::after": {
                  left: "-100%",
                },
              }}
            >
              로그인 / 시작하기
            </Button>
          </Box>

          {/* 기능 소개 섹션 */}
          <Box sx={{ mt: 6 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    textAlign: "center",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  <CalendarMonth
                    sx={{ fontSize: 40, color: colors.primary, mb: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    스케줄 관리
                  </Typography>
                  <Typography variant="body2">간편한 스케줄 작성</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    textAlign: "center",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  <Group sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    직원 관리
                  </Typography>
                  <Typography variant="body2">효율적인 인력 배치</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    textAlign: "center",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  <Payment
                    sx={{ fontSize: 40, color: colors.primary, mb: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    급여 관리
                  </Typography>
                  <Typography variant="body2">자동 급여 계산</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      {/* 하단 푸터 */}
      <Box
        sx={{
          mt: "auto",
          textAlign: "center",
          p: 3,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(5px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} Manezy. 모든 권리 보유.
        </Typography>
      </Box>
    </Box>
  );
};

// 초기 설정 확인 컴포넌트 (마법사 경로 제거 및 리다이렉트 경로 변경)
const SetupCheck = () => {
  const [loading, setLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { isLoggedIn } = React.useContext(AuthContext);

  useEffect(() => {
    if (!isLoggedIn) return; // 로그인 안됐으면 체크 안함

    const checkSetup = async () => {
      try {
        const setupNeeded = await hasInitialSetup();
        setIsSetupComplete(!setupNeeded);
      } catch (error) {
        console.error("초기 설정 확인 오류:", error);
        // 오류 발생 시 우선 설정 완료된 것으로 간주하고 메인으로 보냄
        setIsSetupComplete(true);
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>초기 설정을 확인하는 중...</Typography>
      </Box>
    );
  }

  // 설정 필요 시 (MVP에서는 사용 안함, 메인으로 리다이렉트)
  if (!isSetupComplete) {
    // return <Navigate to="/wizard" replace />; // 제거
    console.warn(
      "초기 설정이 필요하지만 마법사 기능이 제거되었습니다. 메인 페이지로 이동합니다."
    );
    // 필요시 여기에 간단한 안내 메시지 추가 가능
    return <Navigate to="/" replace />; // 메인 페이지로 리다이렉트
  }

  // 설정 완료 시 메인 페이지로 리다이렉트
  return <Navigate to="/" replace />;
};

// 인증 필요한 라우트를 위한 보호 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = React.useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthContext.Provider value={{ isLoggedIn, setLoggedIn }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* 초기 설정 확인 라우트 */}
          <Route
            path="/setup-check"
            element={isLoggedIn ? <SetupCheck /> : <Navigate to="/login" />}
          />
          {/* 마법사 라우트 제거 */}
          {/* <Route path="/wizard" element={isLoggedIn ? <SetupWizard /> : <Navigate to="/login" />} /> */}

          {/* 메인 레이아웃 */}
          <Route
            path="/"
            element={isLoggedIn ? <Layout /> : <Navigate to="/login" />}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="employees" element={<EmployeePage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="settings" element={<StoreSettingsPage />} />
            {/* 다른 보호된 라우트들 */}
          </Route>

          {/* 로그인 안했을 때 기본 리다이렉트 */}
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? "/" : "/login"} />}
          />
        </Routes>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
