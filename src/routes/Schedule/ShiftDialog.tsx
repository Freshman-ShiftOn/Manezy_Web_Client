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

// 근무 이벤트 데이터 구조 단순화 (title, shiftType 제거 고려)
interface ShiftEvent {
  id: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: {
    employeeIds?: string[];
    requiredStaff?: number; // 유지
  };
}

interface ShiftDialogProps {
  eventData: ShiftEvent;
  isNew: boolean;
  employees: Employee[];
  onClose: () => void;
  onSave: (event: ShiftEvent) => void;
}

function ShiftDialog({
  eventData,
  isNew,
  employees,
  onClose,
  onSave,
}: ShiftDialogProps) {
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

    const updatedEvent: ShiftEvent = {
      ...eventData,
      start: startTime!.toISOString(),
      end: endTime!.toISOString(),
      extendedProps: {
        ...eventData.extendedProps,
        employeeIds: selectedEmployeeIds,
        requiredStaff: requiredStaff,
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
