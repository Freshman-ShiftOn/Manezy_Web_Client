import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  FormHelperText,
  Box,
  Chip,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
  FormControlLabel,
  Divider,
  Alert,
  Switch,
  Tooltip,
  Stack,
  Paper,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import {
  format,
  parseISO,
  addHours,
  setHours,
  setMinutes,
  addMinutes,
  differenceInHours,
} from "date-fns";
import { Employee } from "../../lib/types";
import {
  AccessTime,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

// 근무 이벤트 데이터 구조 (backgroundColor, borderColor 추가)
interface ShiftEvent {
  id: string;
  start: string;
  end: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    employeeIds?: string[];
    requiredStaff?: number;
    shiftType?: "open" | "middle" | "close";
  };
}

interface ShiftDialogProps {
  eventData: ShiftEvent;
  isNew: boolean;
  employees: Employee[];
  onClose: () => void;
  onSave: (event: ShiftEvent) => void;
}

// SHIFT_TYPES 상수 복원
const SHIFT_TYPES = [
  { value: "open", label: "오픈", color: "#4CAF50" },
  { value: "middle", label: "미들", color: "#2196F3" },
  { value: "close", label: "마감", color: "#9C27B0" },
];

function ShiftDialog({
  eventData,
  isNew,
  employees,
  onClose,
  onSave,
}: ShiftDialogProps) {
  const theme = useTheme();
  const [startTime, setStartTime] = useState<Date | null>(
    eventData.start ? parseISO(eventData.start) : null
  );
  const [endTime, setEndTime] = useState<Date | null>(
    eventData.end ? parseISO(eventData.end) : null
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    eventData.extendedProps?.employeeIds || []
  );
  const [errors, setErrors] = useState<{ time?: string; employees?: string }>(
    {}
  );

  const [requiredStaff, setRequiredStaff] = useState<number>(
    eventData.extendedProps?.requiredStaff || 1
  );

  // shiftType 상태 복원
  const [shiftType, setShiftType] = useState<"open" | "middle" | "close">(
    (eventData.extendedProps?.shiftType as "open" | "middle" | "close") ||
      "middle"
  );

  // 색상 업데이트 useEffect 복원 (shiftType 변경 시)
  useEffect(() => {
    // 색상 자동 설정 로직은 handleSave에서 처리하므로 주석 처리 또는 제거
    // if (shiftType) { ... }
  }, [shiftType, isNew]);

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!startTime || !endTime) {
      newErrors.time = "시작 시간과 종료 시간을 모두 설정하세요.";
    } else if (startTime >= endTime) {
      newErrors.time = "종료 시간은 시작 시간보다 이후여야 합니다.";
    }
    if (selectedEmployeeIds.length === 0) {
      newErrors.employees = "근무할 직원을 선택하세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const typeInfo = SHIFT_TYPES.find((t) => t.value === shiftType);
    const eventColor = typeInfo?.color || eventData.color || "#AAAAAA";

    const updatedEvent: ShiftEvent = {
      ...eventData,
      start: startTime!.toISOString(),
      end: endTime!.toISOString(),
      color: eventColor,
      backgroundColor: eventColor,
      borderColor: eventColor,
      extendedProps: {
        ...eventData.extendedProps,
        employeeIds: selectedEmployeeIds,
        requiredStaff: requiredStaff,
        shiftType: shiftType,
      },
    };
    onSave(updatedEvent);
  };

  const handleEmployeeChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setSelectedEmployeeIds(
      typeof value === "string" ? value.split(",") : value
    );
  };

  const formatTime = (date: Date | null) => {
    return date ? format(date, "HH:mm") : "--:--";
  };

  const adjustRequiredStaff = (delta: number) => {
    setRequiredStaff((prev) => Math.max(1, prev + delta));
  };

  const calculateWorkHours = () => {
    if (startTime && endTime) {
      return differenceInHours(endTime, startTime);
    }
    return 0;
  };

  // 근무 유형 변경 핸들러 복원
  const handleShiftTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: "open" | "middle" | "close" | null
  ) => {
    if (newType !== null) {
      setShiftType(newType);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isNew ? "새 근무 생성" : "근무 수정"}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="시작 시간"
                value={startTime}
                onChange={setStartTime}
                slotProps={{
                  textField: { fullWidth: true, error: !!errors.time },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="종료 시간"
                value={endTime}
                onChange={setEndTime}
                slotProps={{
                  textField: { fullWidth: true, error: !!errors.time },
                }}
              />
            </LocalizationProvider>
          </Grid>
          {errors.time && (
            <Grid item xs={12}>
              <FormHelperText error>{errors.time}</FormHelperText>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              총 근무 시간: {calculateWorkHours()} 시간
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.employees}>
              <InputLabel id="employee-select-label">직원 배정</InputLabel>
              <Select
                labelId="employee-select-label"
                id="employee-select"
                multiple
                value={selectedEmployeeIds}
                onChange={handleEmployeeChange}
                input={<OutlinedInput label="직원 배정" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const employee = employees.find(
                        (emp) => emp.id === value
                      );
                      return (
                        <Chip
                          key={value}
                          label={employee?.name || value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    <Checkbox
                      checked={selectedEmployeeIds.includes(employee.id)}
                    />
                    <ListItemText
                      primary={employee.name}
                      secondary={employee.role}
                    />
                  </MenuItem>
                ))}
              </Select>
              {errors.employees && (
                <FormHelperText>{errors.employees}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                필요 인원:
              </Typography>
              <IconButton
                size="small"
                onClick={() => adjustRequiredStaff(-1)}
                disabled={requiredStaff <= 1}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ mx: 1, minWidth: "20px", textAlign: "center" }}>
                {requiredStaff}
              </Typography>
              <IconButton size="small" onClick={() => adjustRequiredStaff(1)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              근무 타입
            </Typography>
            <ToggleButtonGroup
              value={shiftType}
              exclusive
              onChange={handleShiftTypeChange}
              aria-label="shift type"
              fullWidth
            >
              {SHIFT_TYPES.map((type) => (
                <ToggleButton
                  key={type.value}
                  value={type.value}
                  aria-label={type.label}
                  sx={{
                    flexGrow: 1,
                    color: shiftType === type.value ? type.color : undefined,
                    borderColor:
                      shiftType === type.value
                        ? alpha(type.color, 0.5)
                        : undefined,
                    "&.Mui-selected": {
                      backgroundColor: alpha(type.color, 0.12),
                      color: type.color,
                      borderColor: alpha(type.color, 0.5),
                      "&:hover": {
                        backgroundColor: alpha(type.color, 0.2),
                      },
                    },
                  }}
                >
                  {type.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!startTime || !endTime || selectedEmployeeIds.length === 0}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShiftDialog;
