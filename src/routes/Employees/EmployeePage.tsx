// src/routes/Employees/EmployeePage.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { getEmployees, getShifts, getStoreInfo } from "../../services/api";
import { Employee, Shift, Store } from "../../lib/types";
import { differenceInHours } from "date-fns";

function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    phoneNumber: "",
    email: "",
    hourlyRate: 9620,
    role: "알바생",
    status: "active",
  });

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // API에서 데이터 가져오기
        const storeData = await getStoreInfo();
        const employeesData = await getEmployees();
        const shiftsData = await getShifts();

        setStore(storeData);
        setEmployees(employeesData);
        setShifts(shiftsData);

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다");
        setLoading(false);
      }
    };

    // 데이터가 없을 경우 샘플 데이터 추가
    if (localStorage.getItem("manezy_employees") === null) {
      // 샘플 데이터 생성
      const sampleEmployees: Employee[] = [
        {
          id: "emp1",
          name: "김지은",
          phoneNumber: "010-1234-5678",
          email: "jieun@example.com",
          hourlyRate: 10000,
          role: "매니저",
          status: "active",
          bankAccount: "신한은행 110-123-456789",
          birthDate: "1995-05-15",
        },
        {
          id: "emp2",
          name: "박민수",
          phoneNumber: "010-8765-4321",
          email: "minsu@example.com",
          hourlyRate: 9620,
          role: "바리스타",
          status: "active",
          bankAccount: "국민은행 123-12-123456",
          birthDate: "1998-11-23",
        },
        {
          id: "emp3",
          name: "이하은",
          phoneNumber: "010-9876-5432",
          email: "haeun@example.com",
          hourlyRate: 9620,
          role: "바리스타",
          status: "active",
          bankAccount: "우리은행 1002-123-456789",
          birthDate: "2000-03-10",
        },
        {
          id: "emp4",
          name: "정준호",
          phoneNumber: "010-2345-6789",
          email: "junho@example.com",
          hourlyRate: 9800,
          role: "홀 서빙",
          status: "active",
          bankAccount: "하나은행 123-456789-01",
          birthDate: "1999-08-25",
        },
      ];

      localStorage.setItem("manezy_employees", JSON.stringify(sampleEmployees));
      setEmployees(sampleEmployees);
    }

    loadData();
  }, []);

  // 알바생별 주간 근무 시간 계산
  const calculateWeeklyHours = (employeeId: string): number => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 이번 주 일요일로 설정

    return shifts
      .filter(
        (shift) =>
          shift.employeeIds.includes(employeeId) &&
          new Date(shift.start) >= startOfWeek
      )
      .reduce((total: number, shift: Shift) => {
        const hours = differenceInHours(
          new Date(shift.end),
          new Date(shift.start)
        );
        return total + hours;
      }, 0);
  };

  // 알바생별 이번 달 예상 월급 계산
  const calculateMonthlyPay = (employee: Employee): number => {
    const weeklyHours = calculateWeeklyHours(employee.id);
    const monthlyHours = weeklyHours * 4; // 4주 기준 월급 계산 (근사치)
    return monthlyHours * employee.hourlyRate;
  };

  // 알바생 추가 다이얼로그 열기
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // 알바생 추가
  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.phoneNumber) {
      alert("이름과 연락처는 필수 입력 항목입니다.");
      return;
    }

    const employee: Employee = {
      id: `emp${Date.now()}`,
      name: newEmployee.name || "",
      phoneNumber: newEmployee.phoneNumber || "",
      email: newEmployee.email || "",
      hourlyRate: newEmployee.hourlyRate || 9620,
      role: newEmployee.role || "알바생",
      status:
        (newEmployee.status as "active" | "inactive" | "pending") || "active",
      bankAccount: newEmployee.bankAccount || "",
      birthDate: newEmployee.birthDate || "",
    };

    const updatedEmployees = [...employees, employee];
    setEmployees(updatedEmployees);
    localStorage.setItem("manezy_employees", JSON.stringify(updatedEmployees));

    setDialogOpen(false);
    setNewEmployee({
      name: "",
      phoneNumber: "",
      email: "",
      hourlyRate: 9620,
      role: "알바생",
      status: "active",
    });
  };

  // 알바생 상태에 따른 색상 반환
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  // 알바생 상태에 따른 한글 이름 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "active":
        return "재직 중";
      case "inactive":
        return "퇴직";
      case "pending":
        return "승인 대기";
      default:
        return "알 수 없음";
    }
  };

  if (loading) {
    return <Box p={3}>데이터를 불러오는 중...</Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h1">
          알바생 관리
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          알바생 등록
        </Button>
      </Box>

      {/* 알바생 통계 카드 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                등록된 알바생
              </Typography>
              <Typography variant="h4">{employees.length}명</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                평균 시급
              </Typography>
              <Typography variant="h4">
                {employees.length > 0
                  ? Math.round(
                      employees.reduce(
                        (acc: number, emp: Employee) => acc + emp.hourlyRate,
                        0
                      ) / employees.length
                    ).toLocaleString()
                  : 0}
                원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                이번 달 예상 급여 총액
              </Typography>
              <Typography variant="h4">
                {employees
                  .reduce(
                    (acc: number, emp: Employee) =>
                      acc + calculateMonthlyPay(emp),
                    0
                  )
                  .toLocaleString()}
                원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 알바생 목록 테이블 */}
      <Paper sx={{ mb: 3, overflow: "auto" }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>시급</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>연락처</TableCell>
              <TableCell>주간 근무</TableCell>
              <TableCell>월 예상 급여</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => {
              const weeklyHours = calculateWeeklyHours(employee.id);
              const monthlyPay = calculateMonthlyPay(employee);

              return (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "primary.main",
                          mr: 1,
                        }}
                      >
                        {employee.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{employee.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{employee.role || "일반 알바"}</TableCell>
                  <TableCell>
                    {employee.hourlyRate.toLocaleString()}원
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(employee.status)}
                      color={getStatusColor(employee.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{employee.phoneNumber}</TableCell>
                  <TableCell>{weeklyHours}시간</TableCell>
                  <TableCell>{monthlyPay.toLocaleString()}원</TableCell>
                  <TableCell align="right">
                    <Tooltip title="수정">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* 알바생 추가 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>알바생 등록</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="이름"
                fullWidth
                required
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="연락처"
                fullWidth
                required
                value={newEmployee.phoneNumber}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    phoneNumber: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="이메일"
                fullWidth
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="시급"
                fullWidth
                type="number"
                value={newEmployee.hourlyRate}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    hourlyRate: Number(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-label">역할</InputLabel>
                <Select
                  labelId="role-label"
                  value={newEmployee.role}
                  label="역할"
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value })
                  }
                >
                  <MenuItem value="매니저">매니저</MenuItem>
                  <MenuItem value="바리스타">바리스타</MenuItem>
                  <MenuItem value="홀 서빙">홀 서빙</MenuItem>
                  <MenuItem value="주방">주방</MenuItem>
                  <MenuItem value="알바생">일반 알바</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">상태</InputLabel>
                <Select
                  labelId="status-label"
                  value={newEmployee.status}
                  label="상태"
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      status: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="active">재직 중</MenuItem>
                  <MenuItem value="inactive">퇴직</MenuItem>
                  <MenuItem value="pending">승인 대기</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="계좌 정보"
                fullWidth
                value={newEmployee.bankAccount}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    bankAccount: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="생년월일"
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newEmployee.birthDate}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, birthDate: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddEmployee}
          >
            등록
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmployeePage;
