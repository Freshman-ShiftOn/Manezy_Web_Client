// src/routes/Settings/AccountSettingsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Container,
  Divider,
  Grid,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LockReset from "@mui/icons-material/LockReset";
// import { useAuth } from '../../context/AuthContext'; // For fetching real user data

const AccountSettingsPage: React.FC = () => {
  // State for loading user data (simulated)
  const [loading, setLoading] = useState(true);

  // Mock user data fetching simulation
  useEffect(() => {
    // Simulate API call to fetch user data
    setTimeout(() => {
      setName(mockUser.name);
      setEmail(mockUser.email);
      setLoading(false);
    }, 500); // Simulate 0.5 second loading time
  }, []);

  // Mock user data
  const mockUser = {
    id: "user123",
    name: "테스트 사용자",
    email: "test@example.com", // Usually email is not changeable or requires verification
  };

  // State for user info form
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Keep state, but field might be disabled
  const [isInfoSaving, setIsInfoSaving] = useState(false); // Loading state for save
  const [originalName, setOriginalName] = useState(""); // Store original name

  // Store original values after loading
  useEffect(() => {
    if (!loading) {
      setOriginalName(name);
    }
  }, [loading, name]);

  // Determine if info has changed
  const isInfoChanged = name !== originalName; // Only track name changes for now

  // State for password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false); // Loading state for password change

  // State for feedback snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Handle info changes
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  // Email change handler (if email is editable)
  // const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setEmail(event.target.value);
  // };

  // Handle info form submit (mock)
  const handleInfoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsInfoSaving(true);
    console.log("기본 정보 업데이트 시뮬레이션:", { name });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In a real app, call API to update info
    setSnackbarMessage("기본 정보가 성공적으로 업데이트되었습니다.");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    setOriginalName(name); // Update original name after successful save
    setIsInfoSaving(false);
  };

  // Handle password form submit (mock)
  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setIsPasswordSaving(true);
    console.log("비밀번호 변경 시뮬레이션");
    // Simulate API call (check current password, then update)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In a real app, call API to change password
    // Example: Check if currentPassword is correct first
    // if (!correctCurrentPassword) { setPasswordError("현재 비밀번호가 틀렸습니다."); setIsPasswordSaving(false); return; }

    setSnackbarMessage("비밀번호가 성공적으로 변경되었습니다.");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    // Clear password fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsPasswordSaving(false);
  };

  // Password visibility toggles (same as before)
  const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
  const handleMouseDownNewPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };
  const handleClickShowConfirmNewPassword = () =>
    setShowConfirmNewPassword((show) => !show);
  const handleMouseDownConfirmNewPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>사용자 정보를 불러오는 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        component="h1"
        sx={{ mb: 4, fontWeight: "bold" }}
      >
        정보 관리
      </Typography>

      {/* Basic Information Section */}
      <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <AccountCircle
            sx={{ mr: 1.5, color: "primary.main" }}
            fontSize="large"
          />
          <Typography variant="h6" component="h2" sx={{ fontWeight: "medium" }}>
            기본 정보
          </Typography>
        </Box>
        <Box
          component="form"
          onSubmit={handleInfoSubmit}
          noValidate
          sx={{ mt: 2 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="이름"
                value={name}
                onChange={handleNameChange}
                variant="filled" // Consistent variant
                InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="이메일 주소 (아이디)"
                type="email"
                value={email}
                // onChange={handleEmailChange} // Typically disabled or special process
                variant="filled"
                InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
                fullWidth
                required
                disabled // Keep email disabled - changing ID is complex
                helperText="아이디(이메일)는 변경할 수 없습니다."
              />
            </Grid>
            <Grid item xs={12} sx={{ textAlign: "right" }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isInfoChanged || isInfoSaving}
                startIcon={
                  isInfoSaving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isInfoSaving ? "저장 중..." : "기본 정보 저장"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Password Change Section */}
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <LockReset sx={{ mr: 1.5, color: "primary.main" }} fontSize="large" />
          <Typography variant="h6" component="h2" sx={{ fontWeight: "medium" }}>
            비밀번호 변경
          </Typography>
        </Box>
        <Box
          component="form"
          onSubmit={handlePasswordSubmit}
          noValidate
          sx={{ mt: 2 }}
        >
          {passwordError && (
            <Alert severity="error" sx={{ mb: 3 }} variant="outlined">
              {passwordError}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="현재 비밀번호"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="filled"
                InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
                fullWidth
                required
                autoComplete="current-password"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="새 비밀번호"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  sx: { borderRadius: 2 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="새 비밀번호 보기 토글"
                        onClick={handleClickShowNewPassword}
                        onMouseDown={handleMouseDownNewPassword}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
                required
                helperText="6자 이상 입력해주세요."
                autoComplete="new-password"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="새 비밀번호 확인"
                type={showConfirmNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  sx: { borderRadius: 2 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="새 비밀번호 확인 보기 토글"
                        onClick={handleClickShowConfirmNewPassword}
                        onMouseDown={handleMouseDownConfirmNewPassword}
                        edge="end"
                      >
                        {showConfirmNewPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
                required
                autoComplete="new-password"
              />
            </Grid>
            <Grid item xs={12} sx={{ textAlign: "right" }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isPasswordSaving}
                startIcon={
                  isPasswordSaving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isPasswordSaving ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Feedback Snackbar (same as before) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000} // Slightly shorter duration
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled" // Use filled variant for Snackbar Alert
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccountSettingsPage;
