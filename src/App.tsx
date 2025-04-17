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
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AccountSettingsPage from "./routes/Settings/AccountSettingsPage";
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
import NewStorePage from "./routes/Setup/NewStorePage";

const SetupCheck = () => {
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const needsSetup = !(await hasInitialSetup());
        setSetupNeeded(needsSetup);
        if (!needsSetup) {
          const info = await getStoreInfo();
          setStoreName(info?.name || "Your Store");
        }
      } catch (error) {
        console.error("Error checking setup:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, []);

  const handleSetup = () => {
    navigate("/setup/new-store");
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
        <Typography sx={{ ml: 2 }}>Checking store setup...</Typography>
      </Box>
    );
  }

  if (setupNeeded) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>
              매장 초기 설정 필요
            </Typography>
            <Typography sx={{ mb: 3 }}>
              환영합니다! 시작하기 전에 매장 정보를 설정해 주세요.
            </Typography>
            <Button variant="contained" onClick={handleSetup}>
              매장 설정하기
            </Button>
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
  const [setupNeeded, setSetupNeeded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const needsSetup = !(await hasInitialSetup());
        setSetupNeeded(needsSetup);

        // 설정 필요 여부에 따라 적절한 페이지로 리디렉션
        if (needsSetup) {
          navigate("/setup/new-store");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking setup:", error);
        navigate("/login"); // 오류 발생 시 로그인 페이지로 이동
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, [navigate]);

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

          {/* 초기 설정 경로 - 인증 불필요 */}
          <Route path="/setup/new-store" element={<NewStorePage />} />

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
