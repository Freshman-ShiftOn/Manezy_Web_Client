import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  FormHelperText,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { Store } from "../../../lib/types";
import { isValid, parse, format } from "date-fns";

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
  const [storeData, setStoreData] = useState<Partial<Store>>(data || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 영업 시간 선택을 위한 Date 객체
  const [openTime, setOpenTime] = useState<Date | null>(
    parse(data.openingHour || "08:00", "HH:mm", new Date())
  );
  const [closeTime, setCloseTime] = useState<Date | null>(
    parse(data.closingHour || "22:00", "HH:mm", new Date())
  );

  // 입력값 변경 핸들러
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setStoreData((prev) => ({
      ...prev,
      [name]:
        name === "baseHourlyRate" || name === "weeklyHolidayHoursThreshold"
          ? Number(value) || 0
          : value,
    }));

    // 오류 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 영업 시간 변경 핸들러
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

      // 시간 오류 초기화
      if (errors.time && openTime && closeTime && openTime < closeTime) {
        setErrors((prev) => ({ ...prev, time: "" }));
      }
    }
  };

  // 유효성 검사 및 데이터 전송
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!storeData.name?.trim()) {
      newErrors.name = "매장 이름을 입력해주세요.";
    }

    if (!storeData.address?.trim()) {
      newErrors.address = "매장 주소를 입력해주세요.";
    }

    if (!storeData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    }

    if (!storeData.baseHourlyRate || storeData.baseHourlyRate <= 0) {
      newErrors.baseHourlyRate = "올바른 기본 시급을 입력해주세요.";
    }

    if (!openTime || !closeTime) {
      newErrors.time = "영업 시작 및 종료 시간을 설정해주세요.";
    } else if (openTime >= closeTime) {
      newErrors.time = "종료 시간은 시작 시간보다 이후여야 합니다.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 부모 컴포넌트로 데이터 전달
    onUpdate(storeData);
    onNext();
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        매장 기본 정보를 입력해주세요
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        매장 운영에 필요한 기본 정보를 설정합니다.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="매장 이름"
            name="name"
            value={storeData.name || ""}
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
            value={storeData.address || ""}
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
            value={storeData.phoneNumber || ""}
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
            value={storeData.baseHourlyRate || ""}
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
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="영업 시작 시간"
              value={openTime}
              onChange={(newValue) => handleTimeChange("openingHour", newValue)}
              ampm={false}
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
              onChange={(newValue) => handleTimeChange("closingHour", newValue)}
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
          {errors.time && <FormHelperText error>{errors.time}</FormHelperText>}
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="주휴수당 기준 시간 (주당)"
            name="weeklyHolidayHoursThreshold"
            type="number"
            value={storeData.weeklyHolidayHoursThreshold || ""}
            onChange={handleInputChange}
            fullWidth
            required
            variant="filled"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">시간</InputAdornment>
              ),
            }}
            helperText="주 15시간 이상 근무 시 주휴수당 지급 (일반적)"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={handleSubmit}>
          다음
        </Button>
      </Box>
    </Box>
  );
}

export default WizardStepStoreInfo;
