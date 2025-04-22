import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./routes/Dashboard/DashboardPage";
import SchedulePage from "./routes/Schedule/SchedulePage";
import EmployeePage from "./routes/Employees/EmployeePage";
import PayrollPage from "./routes/Payroll/PayrollPage";
import StoreSettingsPage from "./routes/Settings/StoreSettingsPage";
import LoginPage from "./routes/Auth/LoginPage";
import SignupPage from "./routes/Auth/SignupPage";
import KakaoCallback from "./routes/Auth/KakaoCallback";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AccountSettingsPage from "./routes/Settings/AccountSettingsPage";
import {
  hasInitialSetup,
  getStoreInfo,
  generateDummyData,
  LS_KEYS,
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
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import {
  CalendarMonth,
  Group,
  Payment,
  Add as AddIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import { appTheme, colors } from "./theme";
import NewStorePage from "./routes/Setup/NewStorePage";
import SetupWizard from "./routes/Setup/SetupWizard";

const SetupCheck = () => {
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        // localStorage에서 직접 확인하여 API 호출 최소화
        const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);
        const storeData = localStorage.getItem(LS_KEYS.STORE);
        const needsSetup = !setupComplete || !storeData;

        setSetupNeeded(needsSetup);

        if (!needsSetup && storeData) {
          try {
            const storeInfo = JSON.parse(storeData);
            setStoreName(storeInfo?.name || "Your Store");
          } catch (e) {
            console.error("Error parsing store data:", e);
          }
        }
      } catch (error) {
        console.error("Error checking setup:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSetup();

    // 5초 후에도 로딩 중이면 기본값 설정
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setSetupNeeded(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleSetup = () => {
    navigate("/setup/wizard");
  };

  const handleNewStore = () => {
    navigate("/setup/wizard?mode=new-store");
  };

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      await generateDummyData();
      alert("Dummy data generated! You might need to refresh.");
      window.location.reload();
    } catch (error) {
      console.error("Error generating dummy data:", error);
      alert("Failed to generate dummy data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>매장 설정 확인 중...</Typography>
      </Box>
    );
  }

  if (setupNeeded) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography
              variant="h4"
              gutterBottom
              textAlign="center"
              color="primary"
            >
              매장 설정이 필요합니다
            </Typography>
            <Typography variant="subtitle1" textAlign="center" sx={{ mb: 4 }}>
              마네지를 시작하기 위해 매장 정보를 설정해주세요.
            </Typography>

            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="center" mb={2}>
                      <StoreIcon color="primary" fontSize="large" />
                    </Box>
                    <Typography variant="h6" gutterBottom textAlign="center">
                      새 매장 설정하기
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      처음 시작하는 경우, 매장 설정 마법사를 통해 기본 정보를
                      설정합니다.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSetup}
                    >
                      시작하기
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="center" mb={2}>
                      <AddIcon color="secondary" fontSize="large" />
                    </Box>
                    <Typography variant="h6" gutterBottom textAlign="center">
                      데모 데이터로 시작하기
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      마네지의 모든 기능을 빠르게 살펴보고 싶다면 샘플 데이터를
                      사용해보세요.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="large"
                      onClick={handleGenerateData}
                    >
                      데모 데이터 생성
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return <Outlet />;
};

// 초기 리디렉션을 처리하는 컴포넌트
const InitialRedirect = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        // localStorage에서 직접 확인하여 API 호출 최소화
        const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);
        const storeData = localStorage.getItem(LS_KEYS.STORE);
        const needsSetup = !setupComplete || !storeData;

        // 설정 필요 여부에 따라 적절한 페이지로 리디렉션
        if (needsSetup) {
          console.log("초기 설정이 필요하므로 마법사로 이동합니다.");
          navigate("/setup/wizard");
        } else {
          // 로그인 상태 확인
          const authToken = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
          if (authToken) {
            console.log("이미 로그인 상태이므로 대시보드로 이동합니다.");
            navigate("/dashboard");
          } else {
            console.log("로그인이 필요합니다.");
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Error checking setup:", error);
        navigate("/login"); // 오류 발생 시 로그인 페이지로 이동
      } finally {
        setLoading(false);
      }
    };

    // 컴포넌트 마운트 즉시 초기화 실행
    checkSetup();

    // 5초 후에도 응답이 없으면 로그인 페이지로 리디렉션하는 안전장치
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Setup check timed out, redirecting to login");
        navigate("/login");
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [navigate, loading]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>페이지 확인 중...</Typography>
      </Box>
    );
  }

  return null; // 리디렉션이 발생하므로 실제로 렌더링되지 않음
};

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

          {/* 초기 설정 경로 - 인증 불필요 */}
          <Route path="/setup/new-store" element={<NewStorePage />} />
          <Route path="/setup/wizard" element={<SetupWizard />} />

          {/* Protected Routes: Require authentication */}
          <Route element={<ProtectedRoute />}>
            {/* Setup Check Route: Runs after login, before main layout */}
            <Route element={<SetupCheck />}>
              {/* Main Layout Route: Wraps all pages needing the sidebar/header */}
              <Route element={<Layout />}>
                {/* Default route within layout -> redirect to dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* Page Routes (relative paths to Layout) */}
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="employees" element={<EmployeePage />} />
                <Route path="payroll" element={<PayrollPage />} />
                <Route path="settings/store" element={<StoreSettingsPage />} />
                <Route
                  path="settings/account"
                  element={<AccountSettingsPage />}
                />
                {/* Catch-all for unknown paths within the layout -> redirect to dashboard */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            </Route>
          </Route>

          {/* 최상위 레벨 catch-all: 설정이 필요하면 setup으로, 아니면 login으로 리디렉션 */}
          <Route path="*" element={<InitialRedirect />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
