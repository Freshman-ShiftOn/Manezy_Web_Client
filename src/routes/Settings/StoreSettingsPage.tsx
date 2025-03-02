import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import {
  Save as SaveIcon,
  Store as StoreIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { getStoreInfo, updateStoreInfo } from "../../services/api";
import { Store } from "../../lib/types";

// 시간 옵션 생성 (30분 간격)
const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, "0");
    options.push(`${hour}:00`);
    options.push(`${hour}:30`);
  }
  return options;
};

const timeOptions = generateTimeOptions();

function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Partial<Store>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // 지점 정보 로드
  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        setLoading(true);
        const storeData = await getStoreInfo();
        setStore(storeData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load store info:", error);
        setSnackbar({
          open: true,
          message: "지점 정보를 불러오는데 실패했습니다.",
          severity: "error",
        });
        setLoading(false);
      }
    };

    loadStoreInfo();
  }, []);

  // 텍스트 필드 값 변경 핸들러
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStore((prev) => ({
      ...prev,
      [name]: name === "baseHourlyRate" ? Number(value) : value,
    }));

    // 오류 상태 지우기
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 시간 선택 핸들러
  const handleTimeChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setStore((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 오류 상태 지우기
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!store.name?.trim()) {
      newErrors.name = "지점명을 입력해주세요";
    }

    if (!store.address?.trim()) {
      newErrors.address = "주소를 입력해주세요";
    }

    if (!store.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요";
    }

    if (!store.baseHourlyRate || store.baseHourlyRate <= 0) {
      newErrors.baseHourlyRate = "유효한 시급을 입력해주세요";
    }

    if (!store.openingHour) {
      newErrors.openingHour = "오픈 시간을 선택해주세요";
    }

    if (!store.closingHour) {
      newErrors.closingHour = "마감 시간을 선택해주세요";
    }

    // 오픈 시간이 마감 시간보다 늦을 경우
    if (
      store.openingHour &&
      store.closingHour &&
      store.openingHour >= store.closingHour
    ) {
      newErrors.closingHour = "마감 시간은 오픈 시간보다 늦어야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 처리
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await updateStoreInfo(store as Store);
      setSaving(false);

      setSnackbar({
        open: true,
        message: "지점 정보가 성공적으로 저장되었습니다.",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to save store info:", error);
      setSaving(false);
      setSnackbar({
        open: true,
        message: "지점 정보 저장에 실패했습니다.",
        severity: "error",
      });
    }
  };

  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        지점 설정
      </Typography>

      <Grid container spacing={3}>
        {/* 지점 기본 정보 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              title="지점 기본 정보"
              avatar={<StoreIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="지점명"
                    name="name"
                    value={store.name || ""}
                    onChange={handleTextChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="주소"
                    name="address"
                    value={store.address || ""}
                    onChange={handleTextChange}
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="전화번호"
                    name="phoneNumber"
                    value={store.phoneNumber || ""}
                    onChange={handleTextChange}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="기본 시급"
                    name="baseHourlyRate"
                    type="number"
                    value={store.baseHourlyRate || ""}
                    onChange={handleTextChange}
                    error={!!errors.baseHourlyRate}
                    helperText={errors.baseHourlyRate}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₩</InputAdornment>
                      ),
                    }}
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 영업 시간 설정 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              title="영업 시간 설정"
              avatar={<AccessTimeIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.openingHour} required>
                    <InputLabel id="opening-hour-label">오픈 시간</InputLabel>
                    <Select
                      labelId="opening-hour-label"
                      name="openingHour"
                      value={store.openingHour || ""}
                      label="오픈 시간"
                      onChange={handleTimeChange}
                    >
                      {timeOptions.map((time) => (
                        <MenuItem key={`open-${time}`} value={time}>
                          {time}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.openingHour && (
                      <Typography color="error" variant="caption">
                        {errors.openingHour}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.closingHour} required>
                    <InputLabel id="closing-hour-label">마감 시간</InputLabel>
                    <Select
                      labelId="closing-hour-label"
                      name="closingHour"
                      value={store.closingHour || ""}
                      label="마감 시간"
                      onChange={handleTimeChange}
                    >
                      {timeOptions.map((time) => (
                        <MenuItem key={`close-${time}`} value={time}>
                          {time}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.closingHour && (
                      <Typography color="error" variant="caption">
                        {errors.closingHour}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info">
                      영업 시간은 근무 일정 관리 및 알바생 가능 시간 필터링에
                      사용됩니다.
                    </Alert>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          disabled={saving}
        >
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default StoreSettingsPage;
