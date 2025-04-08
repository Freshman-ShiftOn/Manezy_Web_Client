// src/routes/Employees/EmployeePage.tsx
import React, { useState, useEffect, useMemo } from "react";
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
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  TableContainer,
  ChipProps,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Payment as PaymentIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { getEmployees, getShifts, getStoreInfo } from "../../services/api";
import { Employee, Shift, Store } from "../../lib/types";
import {
  differenceInHours,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

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

  // 상세 정보 팝업 상태
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

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

  // 알바생 상태에 따른 색상 반환 (반환 타입 명시)
  const getStatusColor = (status: string): ChipProps["color"] => {
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

  // 이전 주 근무 시간 계산 함수
  const calculatePreviousWeekHours = (employeeId: string): number => {
    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));

    return shifts
      .filter(
        (shift) =>
          shift.employeeId === employeeId &&
          new Date(shift.start) >= lastWeekStart &&
          new Date(shift.end) <= lastWeekEnd
      )
      .reduce((total, shift) => {
        return (
          total + differenceInHours(new Date(shift.end), new Date(shift.start))
        );
      }, 0);
  };

  // 월간 근무 시간 계산 함수
  const calculateMonthlyHours = (employeeId: string): number => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return shifts
      .filter(
        (shift) =>
          shift.employeeId === employeeId &&
          new Date(shift.start) >= monthStart &&
          new Date(shift.end) <= monthEnd
      )
      .reduce((total, shift) => {
        return (
          total + differenceInHours(new Date(shift.end), new Date(shift.start))
        );
      }, 0);
  };

  // 대타 요청 가져오기 함수
  const getSubstituteRequests = (employeeId: string) => {
    return shifts.filter(
      (shift) => shift.employeeId === employeeId && shift.isSubRequest === true
    );
  };

  // 근무 변경 내역 가져오기 (예시 함수)
  const getShiftChanges = (employeeId: string) => {
    // 실제 구현에서는 변경 이력 데이터를 가져와야 함
    // 지금은 더미 데이터 반환
    return [
      {
        id: "1",
        date: new Date().toISOString(),
        type: "시간 변경",
        description: "10:00 - 15:00 → 12:00 - 17:00",
      },
      {
        id: "2",
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: "대타 승인",
        description: "김영희의 대타 요청 승인",
      },
    ];
  };

  // 필터링된 직원 목록
  const filteredEmployees = useMemo(() => {
    return employees; // 필터링 없이 전체 반환
  }, [employees]);

  // 역할별 색상 가져오기
  const getRoleColor = (
    role: string
  ): "success" | "primary" | "warning" | "secondary" | "default" => {
    switch (role) {
      case "바리스타":
        return "success"; // 초록색
      case "주방":
        return "primary"; // 파란색
      case "서빙":
        return "warning"; // 주황색
      case "매니저":
        return "secondary"; // 보라색
      default:
        return "default";
    }
  };

  // 상세 정보 팝업 열기
  const handleOpenDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  };

  // 수정 핸들러 함수
  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee(employee);
    setDialogOpen(true);
  };

  // 삭제 핸들러 함수
  const handleDeleteEmployee = async (id: string) => {
    try {
      // 실제 구현에서는 API를 통해 직원 삭제 구현
      const updatedEmployees = employees.filter((emp) => emp.id !== id);
      setEmployees(updatedEmployees);
      // 성공 메시지 표시
    } catch (error) {
      // 에러 처리
      console.error("직원 삭제 중 오류 발생:", error);
    }
  };

  if (loading) {
    return <Box p={3}>데이터를 불러오는 중...</Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        알바생 관리
      </Typography>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">직원 목록</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            알바생 추가
          </Button>
        </Box>
      </Paper>

      {/* 직원 테이블 (기본 정보 위주) */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>연락처</TableCell>
              <TableCell>시급</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow
                key={employee.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => handleOpenDetails(employee)}
              >
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.role || "-"}</TableCell>
                <TableCell>{employee.phoneNumber || "-"}</TableCell>
                <TableCell>{employee.hourlyRate.toLocaleString()}원</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(employee.status)}
                    color={getStatusColor(employee.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEmployee(employee);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(employee.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 직원 추가/수정 다이얼로그 JSX 수정 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {newEmployee.id ? "알바생 수정" : "알바생 추가"}
        </DialogTitle>{" "}
        {/* 수정 시 제목 변경 */}
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {" "}
            {/* 상단 패딩 추가 */}
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
                <InputLabel>역할</InputLabel>
                <Select
                  label="역할"
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value })
                  }
                >
                  {/* 역할 목록 (필요시 수정) */}
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
                <InputLabel>상태</InputLabel>
                <Select
                  label="상태"
                  value={newEmployee.status}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      status: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="active">재직 중</MenuItem>
                  <MenuItem value="inactive">퇴직/휴직</MenuItem>
                  <MenuItem value="pending">승인 대기</MenuItem>
                </Select>
              </FormControl>
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
            {" "}
            {/* 핸들러 수정 필요 시 반영 */}
            {newEmployee.id ? "수정" : "추가"} {/* 버튼 텍스트 변경 */}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 직원 상세 정보 다이얼로그 (단순화) */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        /* 크기 조정 */ fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="h6">
              {selectedEmployee?.name} 상세 정보
            </Typography>
            <IconButton
              sx={{ ml: "auto" }}
              onClick={() => setDetailsOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmployee ? (
            <Grid container spacing={1}>
              {" "}
              {/* 간격 조정 */}
              <Grid item xs={12}>
                <Typography>
                  <strong>역할:</strong> {selectedEmployee.role || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>상태:</strong>{" "}
                  <Chip
                    label={getStatusLabel(selectedEmployee.status)}
                    color={getStatusColor(selectedEmployee.status)}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>연락처:</strong> {selectedEmployee.phoneNumber || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>이메일:</strong> {selectedEmployee.email || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>시급:</strong>{" "}
                  {selectedEmployee.hourlyRate.toLocaleString()}원
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography>선택된 직원이 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmployeePage;
