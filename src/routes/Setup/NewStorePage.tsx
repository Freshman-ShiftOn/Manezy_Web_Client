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
import { storeApi, LS_KEYS } from "../../services/api";
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

  // 컴포넌트 마운트 시 마법사로 리디렉션
  useEffect(() => {
    // 잠시 로딩 상태 표시 후 리디렉션
    const redirectTimer = setTimeout(() => {
      navigate("/setup/wizard?mode=new-store");
    }, 1000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

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
      // API 요구 형식에 맞게 payload 생성
      const requestBody = {
        name: storeData.name || "",
        adress: storeData.address || "",
        dial_numbers: storeData.phoneNumber || "",
        basic_cost: (storeData.baseHourlyRate || 9860).toString(),
        weekly_allowance: (storeData.weeklyHolidayHoursThreshold || 15).toString(),
        images: "",
        contents: ""
      };

      console.log("[POST] createStore payload:", requestBody);

      // 실제 POST 요청
      const response = await storeApi.createStore(requestBody);

      console.log("[POST] createStore response:", response);

      setSnackbarMessage("매장 정보가 저장되었습니다. 로그인하여 시작하세요.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Error saving new store info:", error);
      setSnackbarMessage("매장 정보 저장 중 오류가 발생했습니다.");
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
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          매장 설정 마법사로 이동 중...
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}>
          <CircularProgress />
        </Box>
        <Typography variant="body2" color="text.secondary">
          더 편리한 설정을 위해 마법사로 이동합니다. 자동으로 이동하지 않는 경우
          아래 버튼을 클릭하세요.
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 4 }}
          onClick={() => navigate("/setup/wizard?mode=new-store")}
        >
          마법사로 이동
        </Button>
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
