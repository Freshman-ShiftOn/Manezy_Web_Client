import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { Employee } from "../../lib/types";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface WizardStepAddEmployeesProps {
  data: { employees: Partial<Employee>[] };
  onUpdate: (data: { employees: Partial<Employee>[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

// Employee 데이터와 UI 상태를 위한 확장 인터페이스
interface EmployeeWithUIState extends Partial<Employee> {
  index?: number; // 인덱스 추가를 위한 UI 전용 필드
}

function WizardStepAddEmployees({
  data,
  onUpdate,
  onNext,
  onBack,
}: WizardStepAddEmployeesProps) {
  const [employees, setEmployees] = useState<Partial<Employee>[]>(
    data.employees || []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeWithUIState>(
    {}
  );
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 다이얼로그 열기 - 신규 알바생 추가
  const handleOpenAddDialog = () => {
    setCurrentEmployee({
      status: "active",
      hourlyRate: 9860, // 기본 최저 시급
    });
    setIsEditing(false);
    setErrors({});
    setDialogOpen(true);
  };

  // 다이얼로그 열기 - 기존 알바생 수정
  const handleOpenEditDialog = (employee: Partial<Employee>, index: number) => {
    setCurrentEmployee({ ...employee, index });
    setIsEditing(true);
    setErrors({});
    setDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setCurrentEmployee((prev) => ({
      ...prev,
      [name]: name === "hourlyRate" ? Number(value) : value,
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

  // 알바생 유효성 검사
  const validateEmployee = () => {
    const newErrors: Record<string, string> = {};

    if (!currentEmployee.name?.trim()) {
      newErrors.name = "이름을 입력해주세요";
    }

    if (!currentEmployee.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요";
    }

    if (!currentEmployee.hourlyRate || currentEmployee.hourlyRate <= 0) {
      newErrors.hourlyRate = "유효한 시급을 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 알바생 추가/수정 완료
  const handleSaveEmployee = () => {
    if (!validateEmployee()) return;

    const newEmployees = [...employees];

    if (isEditing && currentEmployee.index !== undefined) {
      // 기존 알바생 수정
      const { index, ...employeeData } = currentEmployee;
      newEmployees[index] = employeeData;
    } else {
      // 새 알바생 추가
      const { index, ...employeeData } = currentEmployee;
      newEmployees.push(employeeData);
    }

    setEmployees(newEmployees);
    handleCloseDialog();
  };

  // 알바생 삭제
  const handleDeleteEmployee = (index: number) => {
    const newEmployees = [...employees];
    newEmployees.splice(index, 1);
    setEmployees(newEmployees);
  };

  // 다음 단계로 진행
  const handleNext = () => {
    onUpdate({ employees });
    onNext();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          알바생 등록
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          지점에서 근무할 알바생 정보를 등록하세요. 나중에 알바생을 초대하거나
          추가할 수도 있습니다.
        </Typography>

        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            알바생 추가
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>시급</TableCell>
                <TableCell>역할</TableCell>
                <TableCell align="right">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.phoneNumber}</TableCell>
                    <TableCell>
                      ₩{employee.hourlyRate?.toLocaleString()}
                    </TableCell>
                    <TableCell>{employee.role || "-"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="수정">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(employee, index)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteEmployee(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    등록된 알바생이 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

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

      {/* 알바생 추가/수정 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? "알바생 정보 수정" : "새 알바생 추가"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이름"
                name="name"
                value={currentEmployee.name || ""}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="전화번호"
                name="phoneNumber"
                value={currentEmployee.phoneNumber || ""}
                onChange={handleInputChange}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber || "예: 010-1234-5678"}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="시급"
                name="hourlyRate"
                type="number"
                value={currentEmployee.hourlyRate || ""}
                onChange={handleInputChange}
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₩</InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="역할"
                name="role"
                value={currentEmployee.role || ""}
                onChange={handleInputChange}
                helperText="예: 바리스타, 홀서빙 등"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일"
                name="email"
                type="email"
                value={currentEmployee.email || ""}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            취소
          </Button>
          <Button
            onClick={handleSaveEmployee}
            color="primary"
            variant="contained"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WizardStepAddEmployees;
