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
  differenceInMinutes,
} from "date-fns";
import { Employee } from "../../lib/types";
import {
  AccessTime,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
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
    repeatDays?: number[]; // 0: 일요일, 1: 월요일, ..., 6: 토요일
  };
}

interface ShiftDialogProps {
  eventData: ShiftEvent;
  isNew: boolean;
  employees: Employee[];
  onClose: () => void;
  onSave: (event: ShiftEvent) => void;
  onDelete?: (id: string) => void;
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
  onDelete,
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

  // 반복 요일 상태 추가
  const [repeatDays, setRepeatDays] = useState<number[]>(
    eventData.extendedProps?.repeatDays || []
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
        repeatDays: repeatDays,
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
      const diffMinutes = differenceInMinutes(endTime, startTime);
      const hours = diffMinutes / 60;
      return hours.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });
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

  // Delete Confirmation Handler
  const handleDelete = () => {
    if (!isNew && window.confirm("정말로 이 근무를 삭제하시겠습니까?")) {
      if (onDelete) {
        onDelete(eventData.id);
      } else {
        console.log("삭제 기능이 구현되지 않았습니다.");
        onClose(); // 대화상자 닫기
      }
    }
  };

  // 반복 요일 핸들러 추가
  const handleRepeatDaysChange = (event: SelectChangeEvent<number[]>) => {
    const {
      target: { value },
    } = event;
    setRepeatDays(typeof value === "string" ? [] : (value as number[]));
  };

  // 요일 정보
  const DAYS_OF_WEEK = [
    { value: 1, label: "월" },
    { value: 2, label: "화" },
    { value: 3, label: "수" },
    { value: 4, label: "목" },
    { value: 5, label: "금" },
    { value: 6, label: "토" },
    { value: 0, label: "일" },
  ];

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6">
            {isNew ? "새 근무 생성" : "근무 수정"}
          </Typography>
          {repeatDays.length > 0 && (
            <Typography variant="caption" color="primary">
              선택한 요일에 근무가 반복 생성됩니다
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
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
                        backgroundColor: alpha(type.color, 0.15),
                      },
                    },
                  }}
                >
                  {type.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              반복 설정
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="repeat-days-label">주간 반복 요일</InputLabel>
              <Select
                labelId="repeat-days-label"
                multiple
                value={repeatDays}
                onChange={handleRepeatDaysChange}
                input={<OutlinedInput label="주간 반복 요일" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((day) => (
                      <Chip
                        key={day}
                        label={
                          DAYS_OF_WEEK.find((d) => d.value === day)?.label || ""
                        }
                        size="small"
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                    },
                  },
                }}
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    <Checkbox checked={repeatDays.indexOf(day.value) > -1} />
                    <ListItemText primary={day.label} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                요일을 선택하면 선택한 요일에 일정이 반복됩니다. 비워두면 단일
                일정만 생성됩니다.
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="시작 시간"
                value={startTime}
                onChange={setStartTime}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.time,
                    size: "small",
                    required: true,
                  },
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
                  textField: {
                    fullWidth: true,
                    error: !!errors.time,
                    size: "small",
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          {errors.time && (
            <Grid item xs={12} sx={{ mt: -1 }}>
              <FormHelperText error>{errors.time}</FormHelperText>
            </Grid>
          )}
          <Grid item xs={12} sx={{ textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              총 근무 시간:{" "}
              <Typography
                component="span"
                sx={{ color: "primary.main", fontWeight: "bold" }}
              >
                {calculateWorkHours()}
              </Typography>{" "}
              시간
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.employees} size="small">
              <InputLabel id="employee-select-label">담당 직원</InputLabel>
              <Select
                labelId="employee-select-label"
                multiple
                value={selectedEmployeeIds}
                onChange={handleEmployeeChange}
                input={
                  <OutlinedInput
                    label="담당 직원"
                    sx={{
                      "& .MuiSelect-select .MuiBox-root": {
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      },
                    }}
                  />
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => {
                      const employee = employees.find((e) => e.id === id);
                      return (
                        <Chip
                          key={id}
                          label={employee ? employee.name : "Unknown"}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                    },
                  },
                }}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    <Checkbox
                      checked={selectedEmployeeIds.indexOf(employee.id) > -1}
                    />
                    <ListItemText primary={employee.name} />
                  </MenuItem>
                ))}
              </Select>
              {errors.employees && (
                <FormHelperText>{errors.employees}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 1,
              }}
            >
              <Typography variant="body2">필요 인원:</Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={() => adjustRequiredStaff(-1)}
                  disabled={requiredStaff <= 1}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography sx={{ mx: 1.5, fontWeight: "bold" }}>
                  {requiredStaff}
                </Typography>
                <IconButton size="small" onClick={() => adjustRequiredStaff(1)}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        {!isNew ? (
          <Button
            onClick={handleDelete}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            삭제
          </Button>
        ) : (
          <Box sx={{ width: 80 }} />
        )}

        <Box>
          <Button onClick={onClose} color="inherit" sx={{ mr: 1 }}>
            취소
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isNew ? "생성" : "저장"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default ShiftDialog;
