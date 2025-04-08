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

// 근무 이벤트 데이터 구조 (단순화)
interface ShiftEvent {
  id: string;
  title: string; // MVP에서 제거 고려 가능
  start: string; // ISO string
  end: string; // ISO string
  color?: string; // 시각적 구분을 위해 유지
  extendedProps?: {
    employeeIds?: string[];
    // employeeNames?: string[]; // 제거
    // note?: string; // 제거
    // recurring?: { ... }; // 제거
    // isSubstituteRequest?: boolean; // 제거
    // isHighPriority?: boolean; // 제거
    // status?: "unassigned" | "assigned" | "substitute-requested"; // 제거
    shiftType?: "open" | "middle" | "close"; // 유지 또는 제거 고려
    requiredStaff?: number; // 유지
    // employeeShiftTimes?: { ... }; // 제거
    // minStaff?: number; // 제거
    // maxStaff?: number; // 제거
  };
}

interface ShiftDialogProps {
  eventData: ShiftEvent;
  isNew: boolean;
  employees: Employee[];
  onClose: () => void;
  onSave: (event: ShiftEvent) => void;
  // onSubstituteRequest?: (event: ShiftEvent, isHighPriority: boolean) => void; // 제거
  // onOpenTemplateManager?: () => void; // 제거
  // onDelete?: () => void; // 제거
}

// 시간대별 색상과 레이블
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
}: // onSubstituteRequest, // 제거
// onOpenTemplateManager, // 제거
// onDelete, // 제거
ShiftDialogProps) {
  const [title, setTitle] = useState<string>(eventData.title || "");
  const [startTime, setStartTime] = useState<Date | null>(
    eventData.start ? parseISO(eventData.start) : null
  );
  const [endTime, setEndTime] = useState<Date | null>(
    eventData.end ? parseISO(eventData.end) : null
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    eventData.extendedProps?.employeeIds || []
  );
  // const [note, setNote] = useState<string>(eventData.extendedProps?.note || ""); // 제거
  const [errors, setErrors] = useState<{
    title?: string; // title 제거 시 함께 제거
    time?: string;
    employees?: string;
  }>({});
  // const [isRecurring, setIsRecurring] = useState<boolean>(false); // 제거
  // const [weeklyDays, setWeeklyDays] = useState<number[]>([]); // 제거
  // const [isSubRequest, setIsSubRequest] = useState<boolean>(false); // 제거
  // const [isHighPriority, setIsHighPriority] = useState<boolean>(false); // 제거

  // 근무 유형 상태 (유지 또는 제거 고려)
  const [shiftType, setShiftType] = useState<"open" | "middle" | "close">(
    (eventData.extendedProps?.shiftType as "open" | "middle" | "close") ||
      "middle"
  );
  // 필요 인원 상태 (유지)
  const [requiredStaff, setRequiredStaff] = useState<number>(
    eventData.extendedProps?.requiredStaff || 1
  );

  // 최소/최대 인원 상태 제거
  // const [minStaff, setMinStaff] = useState<number>(...);
  // const [maxStaff, setMaxStaff] = useState<number>(...);

  // 직원별 근무 시간 상태 제거
  // const [employeeShiftTimes, setEmployeeShiftTimes] = useState<{...}>({});

  // 요일 초기화 useEffect 제거
  // useEffect(() => { ... }, [startTime]);

  // 시간대 타입 변경 시 색상 업데이트 useEffect (유지 또는 수정)
  useEffect(() => {
    if (shiftType) {
      const typeInfo = SHIFT_TYPES.find((t) => t.value === shiftType);
      if (typeInfo && isNew) {
        // 색상 자동 설정 로직 (필요 시 추가)
      }
    }
  }, [shiftType, isNew]);

  // 직원별 근무 시간 업데이트 useEffect 제거
  // useEffect(() => { ... }, [selectedEmployeeIds, startTime, endTime]);

  // 직원별 시간 업데이트 함수 제거
  // const updateAllEmployeeTimes = () => { ... };
  // const handleUpdateEmployeeTime = (...) => { ... };

  // 저장 함수 (단순화)
  const handleSave = () => {
    const newErrors: typeof errors = {};
    // if (!title.trim()) newErrors.title = "제목을 입력하세요."; // title 제거 시 함께 제거
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

    // 업데이트된 이벤트 객체 생성 (단순화)
    const updatedEvent: ShiftEvent = {
      ...eventData,
      title: title || getDefaultTitle(), // 제목 없으면 자동 생성
      start: startTime!.toISOString(),
      end: endTime!.toISOString(),
      color:
        SHIFT_TYPES.find((t) => t.value === shiftType)?.color ||
        eventData.color,
      extendedProps: {
        ...eventData.extendedProps,
        employeeIds: selectedEmployeeIds,
        // employeeNames: employees // 이름 정보 제거
        //   .filter((emp) => selectedEmployeeIds.includes(emp.id))
        //   .map((emp) => emp.name),
        shiftType: shiftType,
        requiredStaff: requiredStaff,
        // note: note, // 제거
        // isSubstituteRequest: isSubRequest, // 제거
        // isHighPriority: isHighPriority, // 제거
        // recurring: isRecurring ? { frequency: "weekly", daysOfWeek: weeklyDays } : undefined, // 제거
        // employeeShiftTimes: // 제거
        //   Object.entries(employeeShiftTimes).reduce((acc, [id, times]) => {
        //     acc[id] = { start: times.start.toISOString(), end: times.end.toISOString() };
        //     return acc;
        //   }, {} as any),
      },
    };

    onSave(updatedEvent);
  };

  // 직원 선택 핸들러 (유지)
  const handleEmployeeChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setSelectedEmployeeIds(
      typeof value === "string" ? value.split(",") : value
    );
  };

  // 시간 포맷 함수 (유지)
  const formatTime = (date: Date | null) => {
    return date ? format(date, "HH:mm") : "--:--";
  };

  // 근무 유형 변경 핸들러 (유지 또는 제거 고려)
  const handleShiftTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: "open" | "middle" | "close" | null
  ) => {
    if (newType) {
      setShiftType(newType);
    }
  };

  // 필요 인원 조정 함수 (유지)
  const adjustRequiredStaff = (delta: number) => {
    setRequiredStaff((prev) => Math.max(1, prev + delta));
  };

  // 기본 제목 함수 (title 제거 시 함께 제거)
  const getDefaultTitle = () => {
    if (selectedEmployeeIds.length > 0) {
      const firstEmployee = employees.find(
        (emp) => emp.id === selectedEmployeeIds[0]
      );
      return firstEmployee ? `${firstEmployee.name} 근무` : "근무";
    } else {
      return "배정 필요";
    }
  };

  // 근무 유형 색상 함수 (유지)
  const getShiftTypeColor = () => {
    return SHIFT_TYPES.find((t) => t.value === shiftType)?.color || "grey";
  };

  // 근무 시간 계산
  const calculateWorkHours = () => {
    if (startTime && endTime) {
      return differenceInHours(endTime, startTime);
    }
    return 0;
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {isNew ? "새 근무 생성" : "근무 수정"}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* 근무 시간 설정 */}
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

          {/* 직원 선택 */}
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

          {/* 필요 인원 설정 */}
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

          {/* 제거된 필드들 주석 처리 또는 삭제 */}
          {/* 근무 유형 선택 (ToggleButtonGroup) */}
          {/* 반복 설정 (Switch, Day Picker) */}
          {/* 대타 요청 (Switch, Priority) */}
          {/* 메모 (TextField) */}
          {/* 직원별 시간 설정 테이블 */}
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
