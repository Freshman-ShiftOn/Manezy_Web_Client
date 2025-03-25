import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import SetupWizard from "./routes/Wizard/SetupWizard";
import DashboardPage from "./routes/Dashboard/DashboardPage";
import SchedulePage from "./routes/Schedule/SchedulePage";
import EmployeePage from "./routes/Employees/EmployeePage";
import PayrollPage from "./routes/Payroll/PayrollPage";
import StoreSettingsPage from "./routes/Settings/StoreSettingsPage";
import SignupPage from "./routes/Auth/SignupPage";
import LoginPage from "./routes/Auth/LoginPage";
import KakaoCallback from "./routes/Auth/KakaoCallback";
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
  setLoggedIn: () => { },
});

// 초기 설정 확인 및 리디렉션 컴포넌트
const SetupCheck = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        setLoading(true);
        const isSetup = await hasInitialSetup();

        if (isSetup) {
          // 지점 정보 재확인
          const storeInfo = await getStoreInfo();
          if (storeInfo && storeInfo.id) {
            console.log("지점 정보 확인됨:", storeInfo);
            navigate("/dashboard");
          } else {
            console.log("지점 ID가 없음, 설정 마법사로 이동");
            navigate("/setup");
          }
        } else {
          console.log("초기 설정 필요, 설정 마법사로 이동");
          navigate("/setup");
        }
      } catch (error) {
        console.error("설정 확인 오류:", error);
        navigate("/setup");
      } finally {
        setLoading(false);
      }
    };

    checkSetup();
  }, [navigate]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress color="primary" />
          <Box ml={2}>환영합니다! 설정을 확인하는 중...</Box>
        </Box>
      </Container>
    );
  }

  return null;
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
  const [isLoggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthContext.Provider value={{ isLoggedIn, setLoggedIn }}>
        <Routes>
          {/* 로그인/회원가입 페이지 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth/callback/kakao" element={<KakaoCallback />} />

          {/* 설정 확인 */}
          <Route
            path="/setup-check"
            element={
              <ProtectedRoute>
                <SetupCheck />
              </ProtectedRoute>
            }
          />

          {/* 마법사 (초기 설정) */}
          <Route
            path="/setup/*"
            element={
              <ProtectedRoute>
                <SetupWizard />
              </ProtectedRoute>
            }
          />

          {/* 메인 레이아웃 안에 들어가는 페이지들 */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/employees" element={<EmployeePage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/settings" element={<StoreSettingsPage />} />
          </Route>

          {/* 기본 리디렉션 */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/setup-check" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
