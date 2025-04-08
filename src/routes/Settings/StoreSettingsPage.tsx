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
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { Save as SaveIcon, Store as StoreIcon } from "@mui/icons-material";
import { getStoreInfo, updateStoreInfo } from "../../services/api";
import { Store } from "../../lib/types";

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
      [name]:
        name === "baseHourlyRate" || name === "weeklyHolidayHoursThreshold"
          ? Number(value) || 0
          : value,
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

    if (
      store.weeklyHolidayHoursThreshold &&
      store.weeklyHolidayHoursThreshold < 0
    ) {
      newErrors.weeklyHolidayHoursThreshold =
        "주휴수당 기준 시간은 0 이상이어야 합니다.";
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
        <Grid item xs={12} md={8} lg={6}>
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

                <Grid item xs={12} sm={6}>
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

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="기본 시급"
                    name="baseHourlyRate"
                    type="number"
                    value={store.baseHourlyRate || ""}
                    onChange={handleTextChange}
                    error={!!errors.baseHourlyRate}
                    helperText={errors.baseHourlyRate}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₩</InputAdornment>
                      ),
                      inputProps: { min: 0 },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="주휴수당 기준 시간 (주당)"
                    name="weeklyHolidayHoursThreshold"
                    type="number"
                    value={store.weeklyHolidayHoursThreshold || ""}
                    onChange={handleTextChange}
                    error={!!errors.weeklyHolidayHoursThreshold}
                    helperText={
                      errors.weeklyHolidayHoursThreshold ||
                      "주 15시간 이상 근무 시 주휴수당 지급 (일반적)"
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">시간</InputAdornment>
                      ),
                      inputProps: { min: 0 },
                    }}
                  />
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
          startIcon={
            saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "변경사항 저장"}
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
