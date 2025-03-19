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
  NotificationsActive,
  AssignmentLate,
  AccessTime,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

// 근무 이벤트 데이터 구조
interface ShiftEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  color?: string;
  extendedProps?: {
    employeeIds?: string[];
    employeeNames?: string[];
    note?: string;
    recurring?: {
      frequency: "weekly";
      daysOfWeek?: number[];
      endDate?: string;
    };
    isSubstituteRequest?: boolean;
    isHighPriority?: boolean;
    status?: "unassigned" | "assigned" | "substitute-requested";
    shiftType?: "open" | "middle" | "close";
    requiredStaff?: number;
    // 각 직원별 근무 시간 정보 추가
    employeeShiftTimes?: {
      [employeeId: string]: {
        start: string; // ISO string
        end: string; // ISO string
      };
    };
    minStaff?: number; // 최소 필요 인원
    maxStaff?: number; // 최대 필요 인원
  };
}

interface ShiftDialogProps {
  eventData: ShiftEvent;
  isNew: boolean;
  employees: Employee[];
  onClose: () => void;
  onSave: (event: ShiftEvent) => void;
  onSubstituteRequest?: (event: ShiftEvent, isHighPriority: boolean) => void;
  onOpenTemplateManager?: () => void;
  onDelete?: () => void;
}

// 시간대별 색상과 레이블
const SHIFT_TYPES = [
  { value: "open", label: "오픈", color: "#4CAF50" },
  { value: "middle", label: "미들", color: "#2196F3" },
  { value: "close", label: "마감", color: "#9C27B0" },
];

// 빠른 시간 템플릿 (각 시간대별 시작-종료 시간)
const TIME_TEMPLATES = {
  open: [
    { label: "오픈 (8:00-13:00)", start: "08:00", end: "13:00" },
    { label: "오픈 (9:00-14:00)", start: "09:00", end: "14:00" },
    { label: "일찍 출근 (7:30-12:30)", start: "07:30", end: "12:30" },
  ],
  middle: [
    { label: "미들 (12:00-17:00)", start: "12:00", end: "17:00" },
    { label: "미들 (13:00-18:00)", start: "13:00", end: "18:00" },
    { label: "짧은 미들 (14:00-17:00)", start: "14:00", end: "17:00" },
    { label: "긴 미들 (11:00-18:00)", start: "11:00", end: "18:00" },
  ],
  close: [
    { label: "마감 (17:00-22:00)", start: "17:00", end: "22:00" },
    { label: "마감 시작 (16:00-21:00)", start: "16:00", end: "21:00" },
    { label: "늦은 마감 (18:00-23:00)", start: "18:00", end: "23:00" },
    { label: "마감 보조 (18:00-22:00)", start: "18:00", end: "22:00" },
  ],
};

function ShiftDialog({
  eventData,
  isNew,
  employees,
  onClose,
  onSave,
  onSubstituteRequest,
  onOpenTemplateManager,
  onDelete,
}: ShiftDialogProps) {
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
  const [note, setNote] = useState<string>(eventData.extendedProps?.note || "");
  const [errors, setErrors] = useState<{
    title?: string;
    time?: string;
    employees?: string;
  }>({});
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [isSubRequest, setIsSubRequest] = useState<boolean>(
    eventData.extendedProps?.isSubstituteRequest || false
  );
  const [isHighPriority, setIsHighPriority] = useState<boolean>(
    eventData.extendedProps?.isHighPriority || false
  );

  // 추가된 상태
  const [shiftType, setShiftType] = useState<"open" | "middle" | "close">(
    (eventData.extendedProps?.shiftType as "open" | "middle" | "close") ||
      "middle"
  );
  const [requiredStaff, setRequiredStaff] = useState<number>(
    eventData.extendedProps?.requiredStaff || 1
  );

  // 최소/최대 인원 상태 추가
  const [minStaff, setMinStaff] = useState<number>(
    eventData.extendedProps?.minStaff || 1
  );
  const [maxStaff, setMaxStaff] = useState<number>(
    eventData.extendedProps?.maxStaff || 4
  );

  // 직원별 근무 시간 상태 추가
  const [employeeShiftTimes, setEmployeeShiftTimes] = useState<{
    [employeeId: string]: {
      start: Date;
      end: Date;
    };
  }>(
    eventData.extendedProps?.employeeShiftTimes
      ? Object.entries(eventData.extendedProps.employeeShiftTimes).reduce(
          (acc, [id, times]) => {
            acc[id] = {
              start: parseISO(times.start),
              end: parseISO(times.end),
            };
            return acc;
          },
          {} as any
        )
      : {}
  );

  // 시작 날짜 기반으로 요일 초기화
  useEffect(() => {
    if (startTime) {
      const dayOfWeek = startTime.getDay();
      if (!weeklyDays.includes(dayOfWeek)) {
        setWeeklyDays([dayOfWeek]);
      }
    }
  }, [startTime]);

  // 시간대 타입 변경 시 색상 업데이트
  useEffect(() => {
    if (shiftType) {
      const typeInfo = SHIFT_TYPES.find((t) => t.value === shiftType);
      if (typeInfo && !eventData.color) {
        // 새 이벤트 생성 시에만 색상 자동 변경
        if (isNew) {
          eventData.color = typeInfo.color;
        }
      }
    }
  }, [shiftType, isNew]);

  // 직원이 선택되거나 제거될 때 직원별 근무 시간 업데이트
  useEffect(() => {
    if (startTime && endTime) {
      // 제거된 직원은 근무 시간에서 삭제
      const updatedEmployeeShiftTimes = { ...employeeShiftTimes };

      // 기존에 있던 직원 중 선택되지 않은 직원 제거
      Object.keys(updatedEmployeeShiftTimes).forEach((id) => {
        if (!selectedEmployeeIds.includes(id)) {
          delete updatedEmployeeShiftTimes[id];
        }
      });

      // 새로 선택된 직원 추가 (기본 시간은 근무 블록 시간과 동일)
      selectedEmployeeIds.forEach((id) => {
        if (!updatedEmployeeShiftTimes[id]) {
          updatedEmployeeShiftTimes[id] = {
            start: new Date(startTime),
            end: new Date(endTime),
          };
        }
      });

      setEmployeeShiftTimes(updatedEmployeeShiftTimes);
    }
  }, [selectedEmployeeIds, startTime, endTime]);

  // 전체 근무 시간이 변경될 때 모든 직원의 시간 업데이트 (옵션)
  const updateAllEmployeeTimes = () => {
    if (startTime && endTime && selectedEmployeeIds.length > 0) {
      const updatedTimes = { ...employeeShiftTimes };

      selectedEmployeeIds.forEach((id) => {
        // 각 직원의 기존 시간을 유지하면서 새 범위 내로 조정
        if (updatedTimes[id]) {
          // 기존 근무 시간 유지하되, 전체 블록 범위 내에 있도록 조정
          updatedTimes[id] = {
            start: new Date(startTime),
            end: new Date(endTime),
          };
        } else {
          // 새 직원은 기본 시간으로 설정
          updatedTimes[id] = {
            start: new Date(startTime),
            end: new Date(endTime),
          };
        }
      });

      setEmployeeShiftTimes(updatedTimes);
    }
  };

  // 개별 직원 시간 업데이트 핸들러
  const handleUpdateEmployeeTime = (
    employeeId: string,
    field: "start" | "end",
    newTime: Date | null
  ) => {
    if (newTime) {
      setEmployeeShiftTimes((prev) => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [field]: newTime,
        },
      }));
    }
  };

  const handleSave = () => {
    // 입력 유효성 검사
    const newErrors: { title?: string; time?: string; employees?: string } = {};

    if (!startTime || !endTime) {
      newErrors.time = "시작 및 종료 시간을 설정해주세요";
    } else if (startTime >= endTime) {
      newErrors.time = "종료 시간은 시작 시간보다 나중이어야 합니다";
    }

    setErrors(newErrors);

    // 에러가 있으면 저장 중단
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // 선택한 직원 이름 추출
    const employeeNames = selectedEmployeeIds.map((id) => {
      const employee = employees.find((e) => e.id === id);
      return employee ? employee.name : "";
    });

    // 직원별 근무 시간을 ISO 문자열로 변환
    const isoEmployeeShiftTimes = selectedEmployeeIds.reduce((acc, id) => {
      if (employeeShiftTimes[id]) {
        acc[id] = {
          start: employeeShiftTimes[id].start.toISOString(),
          end: employeeShiftTimes[id].end.toISOString(),
        };
      }
      return acc;
    }, {} as any);

    // 이벤트 데이터 구성
    const updatedEvent: ShiftEvent = {
      ...eventData,
      title: title.trim() || getDefaultTitle(),
      start: startTime!.toISOString(),
      end: endTime!.toISOString(),
      color: getShiftTypeColor(),
      extendedProps: {
        ...eventData.extendedProps,
        employeeIds: selectedEmployeeIds,
        employeeNames,
        note: note.trim(),
        status:
          selectedEmployeeIds.length === 0
            ? "unassigned"
            : isSubRequest
            ? "substitute-requested"
            : "assigned",
        isSubstituteRequest: isSubRequest,
        isHighPriority,
        shiftType: shiftType,
        requiredStaff: requiredStaff,
        minStaff: minStaff,
        maxStaff: maxStaff,
        employeeShiftTimes: isoEmployeeShiftTimes,
        recurring: isRecurring
          ? {
              frequency: "weekly",
              daysOfWeek: weeklyDays,
            }
          : undefined,
      },
    };

    onSave(updatedEvent);
  };

  const handleEmployeeChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const newSelectedIds = typeof value === "string" ? [value] : value;
    console.log("직원 선택 변경:", newSelectedIds);
    setSelectedEmployeeIds(newSelectedIds);
  };

  // 시간 표시 포맷
  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return format(date, "HH:mm");
  };

  // 대타 요청 처리
  const handleSubstituteRequestToggle = () => {
    if (onSubstituteRequest) {
      onSubstituteRequest(eventData, isHighPriority);
      onClose();
    } else {
      setIsSubRequest(!isSubRequest);
    }
  };

  // 시간대 타입 변경 핸들러
  const handleShiftTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: "open" | "middle" | "close" | null
  ) => {
    if (newType) {
      setShiftType(newType);
    }
  };

  // 빠른 시간 템플릿 적용
  const applyTimeTemplate = (template: { start: string; end: string }) => {
    if (!startTime) return;

    // 현재 날짜 유지하면서 시간만 변경
    const currentDate = startTime;

    // 시작 시간 설정
    const [startHour, startMinute] = template.start.split(":").map(Number);
    const newStartTime = new Date(currentDate);
    newStartTime.setHours(startHour, startMinute, 0);

    // 종료 시간 설정
    const [endHour, endMinute] = template.end.split(":").map(Number);
    const newEndTime = new Date(currentDate);
    newEndTime.setHours(endHour, endMinute, 0);

    setStartTime(newStartTime);
    setEndTime(newEndTime);
  };

  // 필요 인원 조정
  const adjustRequiredStaff = (delta: number) => {
    const newValue = Math.max(1, requiredStaff + delta);
    setRequiredStaff(newValue);
  };

  // 기본 제목 생성 (시간대 타입 기반)
  const getDefaultTitle = () => {
    const typeInfo = SHIFT_TYPES.find((t) => t.value === shiftType);
    return typeInfo ? typeInfo.label : "";
  };

  // 시간대별 색상 가져오기
  const getShiftTypeColor = () => {
    const typeInfo = SHIFT_TYPES.find((t) => t.value === shiftType);
    return typeInfo ? typeInfo.color : eventData.color || "#2196F3";
  };

  // 직원 배정 현황
  const assignedEmployeesCount = selectedEmployeeIds.length;
  const isSufficientStaff = assignedEmployeesCount >= requiredStaff;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {isNew ? "새 근무 일정 생성" : "근무 일정 수정"}
          </Typography>
          {onOpenTemplateManager && (
            <Tooltip title="근무 타입 및 템플릿 관리">
              <IconButton color="primary" onClick={onOpenTemplateManager}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* 시간대 타입 선택 (새로 추가) */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              근무 타입
              <Typography
                variant="caption"
                sx={{ ml: 1, color: "text.secondary" }}
              >
                (타입에 따라 색상이 자동 적용됩니다)
              </Typography>
            </Typography>
            <ToggleButtonGroup
              value={shiftType}
              exclusive
              onChange={(e, newType) => {
                if (newType) setShiftType(newType);
              }}
              aria-label="shift type"
              sx={{ width: "100%" }}
            >
              {SHIFT_TYPES.map((type) => (
                <ToggleButton
                  key={type.value}
                  value={type.value}
                  aria-label={type.label}
                  sx={{
                    flex: 1,
                    backgroundColor:
                      shiftType === type.value
                        ? alpha(type.color, 0.1)
                        : "transparent",
                    color: shiftType === type.value ? type.color : "inherit",
                    borderColor:
                      shiftType === type.value
                        ? type.color
                        : "rgba(0, 0, 0, 0.12)",
                    "&:hover": {
                      backgroundColor: alpha(type.color, 0.1),
                    },
                    "&.Mui-selected": {
                      backgroundColor: alpha(type.color, 0.2),
                      "&:hover": {
                        backgroundColor: alpha(type.color, 0.3),
                      },
                    },
                  }}
                >
                  {type.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {onOpenTemplateManager && (
              <Button
                variant="text"
                size="small"
                onClick={onOpenTemplateManager}
                startIcon={<EditIcon />}
                sx={{ mt: 1 }}
              >
                근무 타입 및 템플릿 관리
              </Button>
            )}
          </Grid>

          {/* 제목 */}
          <Grid item xs={12}>
            <TextField
              label="제목 (선택사항)"
              placeholder={`${getDefaultTitle()} 근무`}
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              error={!!errors.title}
              helperText={
                errors.title || "비워두면 타입에 따라 자동 설정됩니다"
              }
            />
          </Grid>

          {/* 날짜와 시간 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              날짜 및 시간
              {errors.time && (
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  {errors.time}
                </Typography>
              )}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TimePicker
                    label="시작 시간"
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!errors.time,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="종료 시간"
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!errors.time,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>

          {/* 빠른 시간 템플릿 (새로 추가) */}
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              빠른 시간 템플릿:
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {TIME_TEMPLATES[shiftType].map((template, index) => (
                <Chip
                  key={index}
                  label={template.label}
                  onClick={() => {
                    if (startTime) {
                      const newStartTime = new Date(startTime);
                      const [startHour, startMinute] =
                        template.start.split(":");
                      newStartTime.setHours(parseInt(startHour, 10));
                      newStartTime.setMinutes(parseInt(startMinute, 10));
                      setStartTime(newStartTime);

                      const newEndTime = new Date(startTime);
                      const [endHour, endMinute] = template.end.split(":");
                      newEndTime.setHours(parseInt(endHour, 10));
                      newEndTime.setMinutes(parseInt(endMinute, 10));
                      setEndTime(newEndTime);
                    }
                  }}
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
          </Grid>

          {/* 알바생 배정 */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle2">
                <PersonIcon
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                알바생 배정
              </Typography>

              {/* 필요 인원 조정 */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  필요 인원:
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => adjustRequiredStaff(-1)}
                  disabled={requiredStaff <= 1}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    mx: 1,
                    minWidth: "24px",
                    textAlign: "center",
                    fontWeight: "bold",
                    color: (theme) =>
                      requiredStaff > 1
                        ? theme.palette.primary.main
                        : "inherit",
                  }}
                >
                  {requiredStaff}
                </Typography>
                <IconButton size="small" onClick={() => adjustRequiredStaff(1)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* 직원 배정 상태 표시 */}
            <Box
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: isSufficientStaff
                  ? "success.light"
                  : requiredStaff > assignedEmployeesCount + 1
                  ? "error.light"
                  : "warning.light",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2">
                현재 배정: {assignedEmployeesCount}/{requiredStaff}명
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {isSufficientStaff
                  ? "충분한 인원"
                  : requiredStaff > assignedEmployeesCount + 1
                  ? "인원이 많이 부족합니다"
                  : "인원 부족"}
              </Typography>
            </Box>

            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="employee-label">알바생</InputLabel>
              <Select
                multiple
                value={selectedEmployeeIds}
                onChange={handleEmployeeChange}
                input={<OutlinedInput label="알바생" />}
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
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    <Checkbox
                      checked={selectedEmployeeIds.includes(employee.id)}
                    />
                    <ListItemText
                      primary={employee.name}
                      secondary={employee.role || "일반 근무자"}
                    />
                  </MenuItem>
                ))}
              </Select>
              {!employees.length && (
                <FormHelperText>
                  등록된 알바생이 없습니다. 알바생을 먼저 등록해주세요.
                </FormHelperText>
              )}
              {errors.employees && (
                <FormHelperText error>{errors.employees}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* 직원별 개별 근무 시간 설정 */}
          {selectedEmployeeIds.length > 0 && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  직원별 근무 시간 설정
                  <Typography
                    variant="caption"
                    sx={{ ml: 1, color: "text.secondary" }}
                  >
                    (각 직원의 근무 시간을 개별적으로 조정할 수 있습니다)
                  </Typography>
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>직원</TableCell>
                        <TableCell>시작 시간</TableCell>
                        <TableCell>종료 시간</TableCell>
                        <TableCell align="center">근무 시간</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEmployeeIds.map((empId) => {
                        const employee = employees.find((e) => e.id === empId);
                        const empShiftTime = employeeShiftTimes[empId] || {
                          start: startTime || new Date(),
                          end: endTime || new Date(),
                        };

                        // 근무 시간 계산 (시간 단위)
                        const hours = differenceInHours(
                          empShiftTime.end,
                          empShiftTime.start
                        );

                        return (
                          <TableRow key={empId}>
                            <TableCell>{employee?.name || "Unknown"}</TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                variant="outlined"
                                type="time"
                                value={format(empShiftTime.start, "HH:mm")}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = new Date(empShiftTime.start);
                                  newDate.setHours(hours, minutes, 0, 0);

                                  setEmployeeShiftTimes((prev) => ({
                                    ...prev,
                                    [empId]: {
                                      ...prev[empId],
                                      start: newDate,
                                    },
                                  }));
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                variant="outlined"
                                type="time"
                                value={format(empShiftTime.end, "HH:mm")}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = new Date(empShiftTime.end);
                                  newDate.setHours(hours, minutes, 0, 0);

                                  setEmployeeShiftTimes((prev) => ({
                                    ...prev,
                                    [empId]: {
                                      ...prev[empId],
                                      end: newDate,
                                    },
                                  }));
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                fontWeight="medium"
                                color={
                                  hours < 2 ? "error.main" : "text.primary"
                                }
                              >
                                {hours}시간
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box
                  sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    size="small"
                    onClick={() => {
                      // 모든 직원의 시간을 기본 시간으로 일괄 설정
                      const updatedTimes = {};
                      selectedEmployeeIds.forEach((empId) => {
                        updatedTimes[empId] = {
                          start: startTime || new Date(),
                          end: endTime || new Date(),
                        };
                      });
                      setEmployeeShiftTimes(updatedTimes);
                    }}
                  >
                    모든 직원 시간 일괄 적용
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* 메모 */}
          <Grid item xs={12}>
            <TextField
              label="메모"
              placeholder="추가 참고사항"
              fullWidth
              multiline
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>

          {/* 반복 근무 설정 */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label="매주 반복 근무"
            />
            {isRecurring && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" gutterBottom>
                  반복할 요일 선택:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {["일", "월", "화", "수", "목", "금", "토"].map(
                    (day, index) => (
                      <Chip
                        key={index}
                        label={day}
                        size="small"
                        clickable
                        color={
                          weeklyDays.includes(index) ? "primary" : "default"
                        }
                        onClick={() => {
                          if (weeklyDays.includes(index)) {
                            setWeeklyDays(
                              weeklyDays.filter((d) => d !== index)
                            );
                          } else {
                            setWeeklyDays([...weeklyDays, index]);
                          }
                        }}
                      />
                    )
                  )}
                </Box>
              </Box>
            )}
          </Grid>

          {/* 대타 요청 */}
          {!isNew && selectedEmployeeIds.length > 0 && (
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, mt: 1, borderColor: "warning.main" }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isSubRequest}
                      onChange={(e) => setIsSubRequest(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AssignmentLate
                        fontSize="small"
                        color="warning"
                        sx={{ mr: 0.5 }}
                      />
                      <Typography variant="body2">대타 요청하기</Typography>
                    </Box>
                  }
                />

                {isSubRequest && (
                  <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isHighPriority}
                          onChange={(e) => setIsHighPriority(e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <NotificationsActive
                            fontSize="small"
                            color="error"
                            sx={{ mr: 0.5 }}
                          />
                          <Typography variant="body2">긴급 요청</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      긴급 요청은 다른 직원들에게 즉시 알림이 발송됩니다.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          취소
        </Button>
        {!isNew && onDelete && (
          <Button
            onClick={onDelete}
            color="error"
            startIcon={<RemoveIcon />}
            sx={{ marginRight: "auto" }}
          >
            삭제
          </Button>
        )}
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={Object.keys(errors).length > 0}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShiftDialog;
