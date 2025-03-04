import React, { useState } from "react";
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
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { Employee } from "../../lib/types";
import { NotificationsActive, AssignmentLate } from "@mui/icons-material";

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
  };
}

interface ShiftDialogProps {
  eventData: ShiftEvent;
  isNew: boolean;
  employees: Employee[];
  onClose: () => void;
  onSave: (event: ShiftEvent) => void;
  onSubstituteRequest?: (event: ShiftEvent, isHighPriority: boolean) => void;
}

function ShiftDialog({
  eventData,
  isNew,
  employees,
  onClose,
  onSave,
  onSubstituteRequest,
}: ShiftDialogProps) {
  const [title, setTitle] = useState(eventData.title);
  const [startTime, setStartTime] = useState<Date | null>(
    parseISO(eventData.start)
  );
  const [endTime, setEndTime] = useState<Date | null>(parseISO(eventData.end));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    eventData.extendedProps?.employeeIds || []
  );
  const [note, setNote] = useState(eventData.extendedProps?.note || "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubRequest, setIsSubRequest] = useState(
    eventData.extendedProps?.isSubstituteRequest || false
  );
  const [isHighPriority, setIsHighPriority] = useState(
    eventData.extendedProps?.isHighPriority || false
  );
  const [errors, setErrors] = useState<{
    title?: string;
    time?: string;
    employees?: string;
  }>({});

  // 저장 처리
  const handleSave = () => {
    // 유효성 검증
    const newErrors: typeof errors = {};

    if (!startTime || !endTime) {
      newErrors.time = "시작 및 종료 시간을 선택해주세요";
    } else if (startTime >= endTime) {
      newErrors.time = "종료 시간은 시작 시간 이후여야 합니다";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 선택된 알바생들의 이름 목록
    const selectedEmployees = employees.filter((employee) =>
      selectedEmployeeIds.includes(employee.id)
    );
    const employeeNames = selectedEmployees.map((emp) => emp.name);

    console.log("선택된 직원:", {
      직원IDs: selectedEmployeeIds,
      직원이름: employeeNames,
    });

    // 저장할 이벤트 데이터 구성
    const updatedEvent: ShiftEvent = {
      ...eventData,
      title: title.trim() || `근무 (${employeeNames.join(", ") || "미배정"})`,
      start: startTime?.toISOString() || eventData.start,
      end: endTime?.toISOString() || eventData.end,
      extendedProps: {
        ...eventData.extendedProps,
        employeeIds: selectedEmployeeIds,
        employeeNames: employeeNames,
        note: note.trim(),
        recurring: isRecurring
          ? {
              frequency: "weekly",
              daysOfWeek: [new Date(startTime!).getDay()],
            }
          : undefined,
        isSubstituteRequest: isSubRequest,
        isHighPriority: isSubRequest ? isHighPriority : false,
        status: !selectedEmployeeIds.length
          ? "unassigned"
          : isSubRequest
          ? "substitute-requested"
          : "assigned",
      },
    };

    console.log("근무 저장 데이터:", updatedEvent);
    onSave(updatedEvent);
  };

  // 알바생 선택 처리
  const handleEmployeeChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const newSelectedIds = typeof value === "string" ? [value] : value;
    console.log("직원 선택 변경:", newSelectedIds);
    setSelectedEmployeeIds(newSelectedIds);
  };

  // 시간 표시 포맷
  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return format(date, "HH:mm", { locale: enUS });
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

  return (
    <Dialog open maxWidth="sm" fullWidth onClose={onClose}>
      <DialogTitle>{isNew ? "새 근무 일정" : "근무 일정 수정"}</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* 제목 */}
          <Grid item xs={12}>
            <TextField
              label="제목 (선택사항)"
              placeholder="예: 오픈 근무, 마감 근무 등"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>

          {/* 날짜와 시간 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {format(parseISO(eventData.start), "yyyy년 MM월 dd일 (eee)", {
                locale: enUS,
              })}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="시작 시간"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!errors.time,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="종료 시간"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!errors.time,
                  },
                }}
              />
            </LocalizationProvider>
            {errors.time && (
              <FormHelperText error>{errors.time}</FormHelperText>
            )}
          </Grid>

          {/* 알바생 선택 */}
          <Grid item xs={12}>
            <FormControl fullWidth size="small" error={!!errors.employees}>
              <InputLabel>알바생</InputLabel>
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
              size="small"
            />
          </Grid>

          {/* 대타 요청 섹션 (이미 배정된 알바생이 있을 때만 표시) */}
          {!isNew && selectedEmployeeIds.length > 0 && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    대타 요청 관리
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isSubRequest}
                        onChange={handleSubstituteRequestToggle}
                        color="warning"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AssignmentLate
                          fontSize="small"
                          color="warning"
                          sx={{ mr: 0.5 }}
                        />
                        <Typography variant="body2">대타 요청</Typography>
                      </Box>
                    }
                  />

                  {isSubRequest && (
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
                  )}
                </Stack>

                {isSubRequest && (
                  <Alert
                    severity={isHighPriority ? "error" : "warning"}
                    sx={{ mt: 1 }}
                  >
                    {isHighPriority
                      ? "긴급 대타 요청으로 표시됩니다. 우선적으로 처리가 필요합니다."
                      : "대타 요청이 있는 근무로 표시됩니다."}
                  </Alert>
                )}
              </Grid>
            </>
          )}

          {/* 반복 설정 */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label="매주 같은 요일에 반복"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          취소
        </Button>

        <Button onClick={handleSave} color="primary" variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShiftDialog;
