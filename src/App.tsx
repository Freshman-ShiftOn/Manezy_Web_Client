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
    navigate("/settings/store");
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
              Initial Store Setup Required
            </Typography>
            <Typography sx={{ mb: 3 }}>
              Welcome! Please set up your store information to get started.
            </Typography>
            <Button variant="contained" onClick={handleSetup}>
              Go to Store Settings
            </Button>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return <Outlet />;
};

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

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
                <Route path="setup/new-store" element={<NewStorePage />} />
                {/* Catch-all for unknown paths within the layout -> redirect to dashboard */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            </Route>
          </Route>

          {/* Optional: Add a top-level catch-all if needed, e.g., for unauthenticated users accessing invalid paths */}
          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
