import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
} from "@mui/material";

interface WorkingHoursData {
  openingHour: string;
  closingHour: string;
}

interface WizardStepWorkingHoursProps {
  data: WorkingHoursData;
  onUpdate: (data: WorkingHoursData) => void;
  onNext: () => void;
  onBack: () => void;
}

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

function WizardStepWorkingHours({
  data,
  onUpdate,
  onNext,
  onBack,
}: WizardStepWorkingHoursProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHoursData>({
    openingHour: data.openingHour || "09:00",
    closingHour: data.closingHour || "22:00",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setWorkingHours((prev) => ({
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!workingHours.openingHour) {
      newErrors.openingHour = "오픈 시간을 선택해주세요";
    }

    if (!workingHours.closingHour) {
      newErrors.closingHour = "마감 시간을 선택해주세요";
    }

    // 오픈 시간이 마감 시간보다 늦을 경우
    if (
      workingHours.openingHour &&
      workingHours.closingHour &&
      workingHours.openingHour >= workingHours.closingHour
    ) {
      newErrors.closingHour = "마감 시간은 오픈 시간보다 늦어야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onUpdate(workingHours);
      onNext();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          영업시간 설정
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          지점의 기본 영업시간을 설정하세요. 스케줄을 배정할 수 있는 시간대가
          됩니다.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.openingHour}>
              <InputLabel id="opening-hour-label">오픈 시간</InputLabel>
              <Select
                labelId="opening-hour-label"
                name="openingHour"
                value={workingHours.openingHour}
                label="오픈 시간"
                onChange={handleChange}
              >
                {timeOptions.map((time) => (
                  <MenuItem key={`open-${time}`} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
              {errors.openingHour && (
                <FormHelperText>{errors.openingHour}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.closingHour}>
              <InputLabel id="closing-hour-label">마감 시간</InputLabel>
              <Select
                labelId="closing-hour-label"
                name="closingHour"
                value={workingHours.closingHour}
                label="마감 시간"
                onChange={handleChange}
              >
                {timeOptions.map((time) => (
                  <MenuItem key={`close-${time}`} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
              {errors.closingHour && (
                <FormHelperText>{errors.closingHour}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={onBack}>
            이전
          </Button>
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

export default WizardStepWorkingHours;
