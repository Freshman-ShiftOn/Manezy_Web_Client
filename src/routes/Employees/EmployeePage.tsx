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

  // 필터 상태 추가
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 상세 정보 팝업 상태
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [detailsTabValue, setDetailsTabValue] = useState(0);

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
    return employees.filter((employee) => {
      const roleMatch = roleFilter === "all" || employee.role === roleFilter;
      const statusMatch =
        statusFilter === "all" || employee.status === statusFilter;
      return roleMatch && statusMatch;
    });
  }, [employees, roleFilter, statusFilter]);

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

  // 탭 변경 핸들러
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setDetailsTabValue(newValue);
  };

  // 주간 근무 시간 변화율 계산
  const calculateWeeklyHoursChange = (employeeId: string) => {
    const currentWeekHours = calculateWeeklyHours(employeeId);
    const previousWeekHours = calculatePreviousWeekHours(employeeId);

    if (previousWeekHours === 0)
      return { hours: currentWeekHours, percentage: 0, direction: "none" };

    const change = currentWeekHours - previousWeekHours;
    const percentage = Math.round((change / previousWeekHours) * 100);

    return {
      hours: currentWeekHours,
      percentage: Math.abs(percentage),
      direction: change >= 0 ? "up" : "down",
    };
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
      <Typography variant="h4" gutterBottom>
        알바생 관리
      </Typography>

      {/* 요약 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                등록된 알바생
              </Typography>
              <Typography variant="h4">{employees.length}명</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                평균 시급
              </Typography>
              <Typography variant="h4">
                {employees.length > 0
                  ? `₩${Math.round(
                      employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) /
                        employees.length
                    ).toLocaleString()}`
                  : "₩0"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                이번 달 예상 급여
              </Typography>
              <Typography variant="h4">
                {`₩${employees
                  .reduce((sum, emp) => sum + calculateMonthlyPay(emp), 0)
                  .toLocaleString()}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                이번 주 총 근무시간
              </Typography>
              <Typography
                variant="h4"
                style={{ display: "flex", alignItems: "center" }}
              >
                {`${employees.reduce(
                  (sum, emp) => sum + calculateWeeklyHours(emp.id),
                  0
                )}시간`}
                <Tooltip title="지난주 대비 5% 증가">
                  <ArrowUpwardIcon color="success" sx={{ ml: 1 }} />
                </Tooltip>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 필터 및 액션 버튼 */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="role-filter-label">역할</InputLabel>
            <Select
              labelId="role-filter-label"
              value={roleFilter}
              label="역할"
              onChange={(e) => setRoleFilter(e.target.value)}
              startAdornment={
                <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
              }
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="바리스타">바리스타</MenuItem>
              <MenuItem value="주방">주방</MenuItem>
              <MenuItem value="서빙">서빙</MenuItem>
              <MenuItem value="매니저">매니저</MenuItem>
              <MenuItem value="알바생">알바생</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">상태</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="상태"
              onChange={(e) => setStatusFilter(e.target.value)}
              startAdornment={
                <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
              }
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="active">재직중</MenuItem>
              <MenuItem value="inactive">퇴사</MenuItem>
              <MenuItem value="vacation">휴가중</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          알바생 추가
        </Button>
      </Box>

      {/* 알바생 목록 테이블 */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>시급</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>연락처</TableCell>
              <TableCell>근무 시간</TableCell>
              <TableCell>예상 급여</TableCell>
              <TableCell align="center">액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  등록된 알바생이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => {
                const weeklyHoursChange = calculateWeeklyHoursChange(
                  employee.id
                );

                return (
                  <TableRow
                    key={employee.id}
                    hover
                    onClick={() => handleOpenDetails(employee)}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.main",
                          }}
                        >
                          {employee.name.charAt(0)}
                        </Avatar>
                        <Typography>{employee.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.role}
                        color={getRoleColor(employee.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{`₩${employee.hourlyRate.toLocaleString()}`}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(employee.status)}
                        sx={{
                          bgcolor: getStatusColor(employee.status),
                          color: "#fff",
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.phoneNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        주간: {weeklyHoursChange.hours}시간
                        {weeklyHoursChange.direction !== "none" && (
                          <Tooltip
                            title={`지난주 대비 ${
                              weeklyHoursChange.percentage
                            }% ${
                              weeklyHoursChange.direction === "up"
                                ? "증가"
                                : "감소"
                            }`}
                          >
                            <Box component="span" sx={{ ml: 0.5 }}>
                              {weeklyHoursChange.direction === "up" ? (
                                <TrendingUpIcon
                                  fontSize="small"
                                  color="success"
                                />
                              ) : (
                                <TrendingDownIcon
                                  fontSize="small"
                                  color="error"
                                />
                              )}
                            </Box>
                          </Tooltip>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        월간: {calculateMonthlyHours(employee.id)}시간
                      </Typography>
                    </TableCell>
                    <TableCell>{`₩${calculateMonthlyPay(
                      employee
                    ).toLocaleString()}`}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="수정">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEmployee(employee);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmployee(employee.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* 알바생 등록/수정 다이얼로그 */}
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

      {/* 알바생 상세 정보 팝업 */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEmployee && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {selectedEmployee.name.charAt(0)}
                </Avatar>
                <Typography variant="h6">{selectedEmployee.name}</Typography>
                <Chip
                  label={selectedEmployee.role}
                  color={getRoleColor(selectedEmployee.role)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={detailsTabValue}
                  onChange={handleTabChange}
                  aria-label="employee details tabs"
                >
                  <Tab
                    label="근무 일정"
                    icon={<AccessTimeIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="급여 내역"
                    icon={<PaymentIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="대타 요청"
                    icon={<SwapHorizIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="근무 변경 내역"
                    icon={<HistoryIcon />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              {/* 근무 일정 탭 */}
              {detailsTabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    근무 일정 요약
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">
                          이번 주 근무 시간
                        </Typography>
                        <Typography variant="h4">
                          {calculateWeeklyHours(selectedEmployee.id)}시간
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(startOfWeek(new Date()), "yyyy-MM-dd")} ~{" "}
                          {format(endOfWeek(new Date()), "yyyy-MM-dd")}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">
                          이번 달 근무 시간
                        </Typography>
                        <Typography variant="h4">
                          {calculateMonthlyHours(selectedEmployee.id)}시간
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(startOfMonth(new Date()), "yyyy-MM-dd")} ~{" "}
                          {format(endOfMonth(new Date()), "yyyy-MM-dd")}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                    다가오는 근무 일정
                  </Typography>
                  <List>
                    {shifts
                      .filter(
                        (shift) =>
                          shift.employeeId === selectedEmployee.id &&
                          new Date(shift.start) > new Date()
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.start).getTime() -
                          new Date(b.start).getTime()
                      )
                      .slice(0, 5)
                      .map((shift) => (
                        <ListItem key={shift.id} divider>
                          <ListItemIcon>
                            <AccessTimeIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={format(
                              new Date(shift.start),
                              "yyyy-MM-dd (EEE)"
                            )}
                            secondary={`${format(
                              new Date(shift.start),
                              "HH:mm"
                            )} ~ ${format(
                              new Date(shift.end),
                              "HH:mm"
                            )} (${differenceInHours(
                              new Date(shift.end),
                              new Date(shift.start)
                            )}시간)`}
                          />
                          {shift.isSubRequest && (
                            <Chip
                              label="대타 요청"
                              color="warning"
                              size="small"
                            />
                          )}
                        </ListItem>
                      ))}
                    {shifts.filter(
                      (shift) =>
                        shift.employeeId === selectedEmployee.id &&
                        new Date(shift.start) > new Date()
                    ).length === 0 && (
                      <ListItem>
                        <ListItemText primary="예정된 근무 일정이 없습니다." />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {/* 급여 내역 탭 */}
              {detailsTabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    급여 내역
                  </Typography>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1">
                      이번 달 예상 급여
                    </Typography>
                    <Typography variant="h4">
                      ₩{calculateMonthlyPay(selectedEmployee).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      시급: ₩{selectedEmployee.hourlyRate.toLocaleString()} ×{" "}
                      {calculateMonthlyHours(selectedEmployee.id)}시간
                    </Typography>
                  </Paper>

                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                    최근 급여 내역
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    급여 내역은 급여 관리 화면에서 확인 및 관리할 수 있습니다.
                  </Alert>
                </Box>
              )}

              {/* 대타 요청 탭 */}
              {detailsTabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    대타 요청 내역
                  </Typography>
                  <List>
                    {getSubstituteRequests(selectedEmployee.id).length > 0 ? (
                      getSubstituteRequests(selectedEmployee.id).map(
                        (request) => (
                          <ListItem key={request.id} divider>
                            <ListItemIcon>
                              <SwapHorizIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={format(
                                new Date(request.start),
                                "yyyy-MM-dd (EEE)"
                              )}
                              secondary={`${format(
                                new Date(request.start),
                                "HH:mm"
                              )} ~ ${format(
                                new Date(request.end),
                                "HH:mm"
                              )} (${differenceInHours(
                                new Date(request.end),
                                new Date(request.start)
                              )}시간)`}
                            />
                            {request.isHighPriority && (
                              <Chip
                                label="우선순위 높음"
                                color="error"
                                size="small"
                              />
                            )}
                          </ListItem>
                        )
                      )
                    ) : (
                      <ListItem>
                        <ListItemText primary="대타 요청 내역이 없습니다." />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {/* 근무 변경 내역 탭 */}
              {detailsTabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    근무 변경 내역
                  </Typography>
                  <List>
                    {getShiftChanges(selectedEmployee.id).map((change) => (
                      <ListItem key={change.id} divider>
                        <ListItemIcon>
                          <HistoryIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${change.type}: ${change.description}`}
                          secondary={format(
                            new Date(change.date),
                            "yyyy-MM-dd HH:mm"
                          )}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>닫기</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEmployee(selectedEmployee);
                  setDetailsOpen(false);
                }}
              >
                수정
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default EmployeePage;
