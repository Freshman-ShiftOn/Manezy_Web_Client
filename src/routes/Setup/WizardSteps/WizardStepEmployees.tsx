import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Employee } from "../../../lib/types";

// 직원 타입 옵션
const ROLE_OPTIONS = [
  { value: "매니저", label: "매니저" },
  { value: "바리스타", label: "바리스타" },
  { value: "알바생", label: "알바생" },
  { value: "주방", label: "주방" },
  { value: "홀", label: "홀" },
  { value: "기타", label: "기타" },
];

interface WizardStepEmployeesProps {
  data: { employees: Partial<Employee>[] };
  baseHourlyRate: number;
  onUpdate: (data: { employees: Partial<Employee>[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

function WizardStepEmployees({
  data,
  baseHourlyRate,
  onUpdate,
  onNext,
  onBack,
}: WizardStepEmployeesProps) {
  const [employees, setEmployees] = useState<Partial<Employee>[]>(
    data.employees || []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({
    name: "",
    phoneNumber: "",
    role: "바리스타",
    hourlyRate: baseHourlyRate,
    status: "active",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  // 직원 추가/편집 대화상자 열기
  const handleOpenDialog = (index?: number) => {
    if (index !== undefined) {
      // 직원 편집 모드
      setCurrentEmployee({ ...employees[index] });
      setEditingIndex(index);
    } else {
      // 직원 추가 모드
      setCurrentEmployee({
        id: `emp-${Date.now()}`,
        name: "",
        phoneNumber: "",
        role: "바리스타",
        hourlyRate: baseHourlyRate,
        status: "active",
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  // 직원 추가/수정 대화상자 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setErrors({});
  };

  // 직원 정보 입력 변경 핸들러
  const handleEmployeeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setCurrentEmployee((prev) => ({
      ...prev,
      [name]: name === "hourlyRate" ? Number(value) || 0 : value,
    }));

    // 오류 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 직원 정보 유효성 검사
  const validateEmployee = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentEmployee.name?.trim()) {
      newErrors.name = "직원 이름을 입력해주세요.";
    }

    if (!currentEmployee.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    }

    if (!currentEmployee.hourlyRate || currentEmployee.hourlyRate < 0) {
      newErrors.hourlyRate = "올바른 시급을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 직원 추가 또는 수정 완료
  const handleSaveEmployee = () => {
    if (!validateEmployee()) return;

    const updatedEmployees = [...employees];

    if (editingIndex !== null) {
      // 직원 정보 수정
      updatedEmployees[editingIndex] = currentEmployee;
    } else {
      // 새 직원 추가
      updatedEmployees.push(currentEmployee);
    }

    setEmployees(updatedEmployees);
    onUpdate({ employees: updatedEmployees });

    handleCloseDialog();
    setSnackbar({
      open: true,
      message:
        editingIndex !== null
          ? "직원 정보가 수정되었습니다."
          : "새 직원이 추가되었습니다.",
      severity: "success",
    });
  };

  // 직원 삭제
  const handleDeleteEmployee = (index: number) => {
    if (employees.length <= 1) {
      setSnackbar({
        open: true,
        message: "최소 한 명의 직원은 필요합니다.",
        severity: "error",
      });
      return;
    }

    const updatedEmployees = [...employees];
    updatedEmployees.splice(index, 1);
    setEmployees(updatedEmployees);
    onUpdate({ employees: updatedEmployees });

    setSnackbar({
      open: true,
      message: "직원이 삭제되었습니다.",
      severity: "success",
    });
  };

  // 스낵바 닫기
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 다음 단계로 이동 전 유효성 검사
  const handleNext = () => {
    if (employees.length === 0) {
      setSnackbar({
        open: true,
        message: "최소 한 명의 직원을 등록해주세요.",
        severity: "error",
      });
      return;
    }

    onNext();
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        직원 정보를 등록해주세요
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        매장에서 근무할 직원 정보를 입력합니다. 직원은 추후에도 추가/변경할 수
        있습니다.
      </Typography>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">직원 목록</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          직원 추가
        </Button>
      </Box>

      {employees.length === 0 ? (
        <Typography
          sx={{ textAlign: "center", my: 4, color: "text.secondary" }}
        >
          등록된 직원이 없습니다. 직원을 추가해주세요.
        </Typography>
      ) : (
        <List sx={{ mb: 3 }}>
          {employees.map((employee, index) => (
            <React.Fragment key={employee.id || index}>
              {index > 0 && <Divider />}
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(index)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteEmployee(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={employee.name || "(이름 없음)"}
                  secondary={
                    <>
                      {employee.role} · {employee.hourlyRate}원/시간
                      <br />
                      {employee.phoneNumber}
                    </>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button variant="outlined" onClick={onBack}>
          이전
        </Button>
        <Button variant="contained" onClick={handleNext}>
          다음
        </Button>
      </Box>

      {/* 직원 추가/수정 대화상자 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? "직원 정보 수정" : "새 직원 추가"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="이름"
                name="name"
                value={currentEmployee.name || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="전화번호"
                name="phoneNumber"
                value={currentEmployee.phoneNumber || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                required
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="직무"
                name="role"
                value={currentEmployee.role || "바리스타"}
                onChange={handleEmployeeInputChange}
                fullWidth
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="시급"
                name="hourlyRate"
                type="number"
                value={currentEmployee.hourlyRate || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                required
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₩</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            취소
          </Button>
          <Button onClick={handleSaveEmployee} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WizardStepEmployees;
