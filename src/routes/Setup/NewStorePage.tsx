import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Container,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  FormHelperText,
  InputAdornment,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { useNavigate } from "react-router-dom";
import { saveStoreSetup, LS_KEYS } from "../../services/api";
import { Store } from "../../lib/types";
import { isValid, parse, format } from "date-fns";

const NewStorePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [storeData, setStoreData] = useState<Partial<Store>>({
    name: "",
    address: "",
    phoneNumber: "",
    baseHourlyRate: 9860, // Default minimum wage
    openingHour: "08:00", // Default opening hour
    closingHour: "22:00", // Default closing hour
    weeklyHolidayHoursThreshold: 15, // Default holiday threshold
  });
  const [openTime, setOpenTime] = useState<Date | null>(
    parse("08:00", "HH:mm", new Date())
  );
  const [closeTime, setCloseTime] = useState<Date | null>(
    parse("22:00", "HH:mm", new Date())
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setStoreData((prev) => ({
      ...prev,
      [name]:
        name === "baseHourlyRate" || name === "weeklyHolidayHoursThreshold"
          ? Number(value) || 0
          : value,
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTimeChange = (
    field: "openingHour" | "closingHour",
    newValue: Date | null
  ) => {
    if (newValue && isValid(newValue)) {
      const formattedTime = format(newValue, "HH:mm");
      if (field === "openingHour") {
        setOpenTime(newValue);
        setStoreData((prev) => ({ ...prev, openingHour: formattedTime }));
      } else {
        setCloseTime(newValue);
        setStoreData((prev) => ({ ...prev, closingHour: formattedTime }));
      }
      // Clear time error if valid times are selected
      if (errors.time && openTime && closeTime && openTime < closeTime) {
        setErrors((prev) => ({ ...prev, time: "" }));
      }
    } else {
      if (field === "openingHour") setOpenTime(null);
      else setCloseTime(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!storeData.name?.trim()) newErrors.name = "매장 이름을 입력해주세요.";
    if (!storeData.address?.trim())
      newErrors.address = "매장 주소를 입력해주세요.";
    if (!storeData.phoneNumber?.trim())
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    if (!storeData.baseHourlyRate || storeData.baseHourlyRate <= 0)
      newErrors.baseHourlyRate = "올바른 기본 시급을 입력해주세요.";
    if (!openTime || !closeTime)
      newErrors.time = "영업 시작 및 종료 시간을 설정해주세요.";
    else if (openTime >= closeTime)
      newErrors.time = "종료 시간은 시작 시간보다 이후여야 합니다.";
    if (
      !storeData.weeklyHolidayHoursThreshold ||
      storeData.weeklyHolidayHoursThreshold <= 0
    )
      newErrors.weeklyHolidayHoursThreshold =
        "올바른 주휴수당 기준 시간을 입력해주세요.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create the store object to save (overwrite)
      const newStore: Store = {
        id: `store-${Date.now()}`, // Generate a new ID or use a fixed one if overwriting
        name: storeData.name || "",
        address: storeData.address || "",
        phoneNumber: storeData.phoneNumber || "",
        baseHourlyRate: storeData.baseHourlyRate || 9860,
        openingHour: storeData.openingHour || "08:00",
        closingHour: storeData.closingHour || "22:00",
        weeklyHolidayHoursThreshold:
          storeData.weeklyHolidayHoursThreshold || 15,
      };

      // Overwrite existing store data in localStorage
      localStorage.setItem(LS_KEYS.STORE, JSON.stringify(newStore));
      localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true"); // Ensure setup is marked complete

      // Note: This simple overwrite might clear shifts/employees if not handled carefully
      // For MVP, we assume a clean slate or user understands the implication.
      // Consider clearing related data explicitly if needed:
      // localStorage.removeItem(LS_KEYS.SHIFTS);
      // localStorage.removeItem(LS_KEYS.EMPLOYEES);

      setSnackbarMessage("매장 정보가 저장되었습니다. 로그인하여 시작하세요.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 스낵바가 표시된 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Error saving new store info:", error);
      setSnackbarMessage("매장 정보 저장 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      // Keep loading true because page will reload
      // setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        새 매장 생성
      </Typography>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 500 }}>
          매장 기본 정보 입력
        </Typography>
        <Grid container spacing={3}>
          {/* Input Fields */}
          <Grid item xs={12}>
            <TextField
              label="매장 이름"
              name="name"
              value={storeData.name}
              onChange={handleInputChange}
              fullWidth
              required
              variant="filled"
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="매장 주소"
              name="address"
              value={storeData.address}
              onChange={handleInputChange}
              fullWidth
              required
              variant="filled"
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="전화번호"
              name="phoneNumber"
              value={storeData.phoneNumber}
              onChange={handleInputChange}
              fullWidth
              required
              variant="filled"
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="기본 시급"
              name="baseHourlyRate"
              type="number"
              value={storeData.baseHourlyRate}
              onChange={handleInputChange}
              fullWidth
              required
              variant="filled"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₩</InputAdornment>
                ),
              }}
              error={!!errors.baseHourlyRate}
              helperText={
                errors.baseHourlyRate || "직원 등록 시 기본값으로 사용됩니다."
              }
            />
          </Grid>
          {/* Time Pickers */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="영업 시작 시간"
                value={openTime}
                onChange={(newValue) =>
                  handleTimeChange("openingHour", newValue)
                }
                ampm={false} // 24시간 형식 사용
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "filled",
                    required: true,
                    error: !!errors.time,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="영업 종료 시간"
                value={closeTime}
                onChange={(newValue) =>
                  handleTimeChange("closingHour", newValue)
                }
                ampm={false}
                minTime={openTime || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "filled",
                    required: true,
                    error: !!errors.time,
                  },
                }}
              />
            </LocalizationProvider>
            {errors.time && (
              <FormHelperText error sx={{ textAlign: "right", mt: 1 }}>
                {errors.time}
              </FormHelperText>
            )}
          </Grid>
          {/* Holiday Pay Threshold */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="주휴수당 기준 시간 (주당)"
              name="weeklyHolidayHoursThreshold"
              type="number"
              value={storeData.weeklyHolidayHoursThreshold}
              onChange={handleInputChange}
              fullWidth
              required
              variant="filled"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">시간</InputAdornment>
                ),
              }}
              error={!!errors.weeklyHolidayHoursThreshold}
              helperText={
                errors.weeklyHolidayHoursThreshold ||
                "주 15시간 이상 근무 시 주휴수당 지급 (일반적)"
              }
            />
          </Grid>

          {/* Save Button */}
          <Grid
            item
            xs={12}
            sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
              size="large"
            >
              {loading ? "저장 중..." : "새 매장 정보 저장"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000} // Longer duration before reload
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewStorePage;
