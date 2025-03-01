// src/routes/Wizard/WizardStepStoreInfo.tsx
import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  InputAdornment,
} from "@mui/material";
import { Store } from "../../lib/types";

interface WizardStepStoreInfoProps {
  data: Partial<Store>;
  onUpdate: (data: Partial<Store>) => void;
  onNext: () => void;
}

function WizardStepStoreInfo({
  data,
  onUpdate,
  onNext,
}: WizardStepStoreInfoProps) {
  const [storeData, setStoreData] = React.useState<Partial<Store>>(data || {});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setStoreData((prev) => ({
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

  // 유효성 검사
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!storeData.name?.trim()) {
      newErrors.name = "지점명을 입력해주세요";
    }

    if (!storeData.address?.trim()) {
      newErrors.address = "주소를 입력해주세요";
    }

    if (!storeData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요";
    }

    if (!storeData.baseHourlyRate || storeData.baseHourlyRate <= 0) {
      newErrors.baseHourlyRate = "유효한 시급을 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 다음 단계로 진행
  const handleNext = () => {
    if (validateForm()) {
      onUpdate(storeData);
      onNext();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          지점 정보 설정
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="지점명"
              name="name"
              value={storeData.name || ""}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name || "예: 카페 성수점"}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="주소"
              name="address"
              value={storeData.address || ""}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address || "예: 서울시 성동구 성수동 123-45"}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="전화번호"
              name="phoneNumber"
              value={storeData.phoneNumber || ""}
              onChange={handleChange}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber || "예: 02-1234-5678"}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="기본 시급"
              name="baseHourlyRate"
              type="number"
              value={storeData.baseHourlyRate || ""}
              onChange={handleChange}
              error={!!errors.baseHourlyRate}
              helperText={errors.baseHourlyRate || "법정 최저시급 이상"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₩</InputAdornment>
                ),
              }}
              required
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            size="large"
          >
            다음
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default WizardStepStoreInfo;
