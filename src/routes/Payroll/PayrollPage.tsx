// src/routes/Payroll/PayrollPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  Grid,
  Divider,
  Tooltip,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { getEmployees, getShifts } from "../../services/api";
import { Employee, Shift } from "../../lib/types";
import {
  differenceInHours,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";

interface PayrollData {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  wage: number;
  extraPay: number;
  deduction: number;
  extraPayDetails: Array<{ reason: string; amount: number }>;
  deductionDetails: Array<{ reason: string; amount: number }>;
  confirmed: boolean;
  paid: boolean;
}

interface PayrollHistoryEntry {
  month: string;
  totalHours: number;
  totalPay: number;
  paid: boolean;
}

const extraPayReasons = [
  "연장근무 수당",
  "야간근무 수당",
  "휴일근무 수당",
  "특별 수당",
  "인센티브",
  "휴가 수당",
  "기타 수당",
];

const deductionReasons = [
  "지각 공제",
  "조기 퇴근 공제",
  "결근 공제",
  "사회보험료",
  "소득세",
  "기타 공제",
];

function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");
  const [extraPayDialogOpen, setExtraPayDialogOpen] = useState(false);
  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<PayrollData | null>(
    null
  );

  // 새로운 상태 추가
  const [payrollDetailDialogOpen, setPayrollDetailDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(
    null
  );
  const [detailsTabValue, setDetailsTabValue] = useState(0);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // API에서 데이터 가져오기
        const employeesData = await getEmployees();
        const shiftsData = await getShifts();

        setEmployees(employeesData);
        setShifts(shiftsData);

        // 급여 데이터 생성
        generatePayrollData(employeesData, shiftsData);

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 급여 데이터 생성
  const generatePayrollData = (employees: Employee[], shifts: Shift[]) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const payrollData = employees.map((employee) => {
      // 이번 달 근무 필터링
      const employeeShifts = shifts.filter((shift) => {
        const shiftStart = new Date(shift.start);
        return (
          shift.employeeIds.includes(employee.id) &&
          isWithinInterval(shiftStart, { start: monthStart, end: monthEnd })
        );
      });

      // 총 근무 시간 계산
      const totalHours = employeeShifts.reduce((sum, shift) => {
        return (
          sum + differenceInHours(new Date(shift.end), new Date(shift.start))
        );
      }, 0);

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalHours,
        wage: employee.hourlyRate,
        extraPay: 0,
        deduction: 0,
        extraPayDetails: [],
        deductionDetails: [],
        confirmed: false,
        paid: false,
      };
    });

    setPayrolls(payrollData);
  };

  // 급여 상세 정보 다이얼로그 열기
  const handleOpenPayrollDetails = (payroll: PayrollData) => {
    const employee = employees.find((emp) => emp.id === payroll.employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setSelectedPayroll(payroll);
      setPayrollDetailDialogOpen(true);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setDetailsTabValue(newValue);
  };

  // 미확정 급여 개수 계산
  const getUnconfirmedCount = () => {
    return payrolls.filter((p) => !p.confirmed).length;
  };

  // 지급 완료 상태 변경 핸들러
  const handlePaidStatusChange = (index: number) => {
    const updatedPayrolls = [...payrolls];
    updatedPayrolls[index].paid = !updatedPayrolls[index].paid;
    setPayrolls(updatedPayrolls);

    // 실제 구현에서는 API를 통해 저장 필요
    setSnackbarMessage("지급 상태가 변경되었습니다");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // 급여 내역 데이터 가져오기 (이전 3개월)
  const getPayrollHistory = (employeeId: string): PayrollHistoryEntry[] => {
    // 실제 구현에서는 API에서 데이터를 가져와야 함
    // 현재는 더미 데이터 반환
    const now = new Date();
    return [
      {
        month: format(now, "yyyy-MM"),
        totalHours: 120,
        totalPay: 1200000,
        paid: false,
      },
      {
        month: format(subMonths(now, 1), "yyyy-MM"),
        totalHours: 115,
        totalPay: 1150000,
        paid: true,
      },
      {
        month: format(subMonths(now, 2), "yyyy-MM"),
        totalHours: 125,
        totalPay: 1250000,
        paid: true,
      },
    ];
  };

  // 주간 근무 시간 데이터 가져오기 (더미 데이터)
  const getWeeklyHoursData = (employeeId: string) => {
    // 실제 구현에서는 API에서 데이터를 가져와야 함
    return [
      { week: "1주차", hours: 30 },
      { week: "2주차", hours: 32 },
      { week: "3주차", hours: 28 },
      { week: "4주차", hours: 30 },
    ];
  };

  // 급여 확정 후 확인 메시지
  const handleConfirmPayroll = () => {
    // 모든 급여 확정 처리
    const updatedPayrolls = payrolls.map((p) => ({
      ...p,
      confirmed: true,
    }));

    setPayrolls(updatedPayrolls);
    setConfirmDialogOpen(false);

    let message = "급여가 성공적으로 확정되었습니다";
    if (sendNotification) {
      message += " (알림이 전송되었습니다)";
    }

    setSnackbarMessage(message);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        급여 관리
      </Typography>

      {/* 급여 요약 정보 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                총 급여
              </Typography>
              <Typography variant="h4">
                ₩
                {payrolls
                  .reduce(
                    (sum, p) => sum + p.wage + p.extraPay - p.deduction,
                    0
                  )
                  .toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                평균 급여
              </Typography>
              <Typography variant="h4">
                {payrolls.length > 0
                  ? `₩${Math.round(
                      payrolls.reduce(
                        (sum, p) => sum + p.wage + p.extraPay - p.deduction,
                        0
                      ) / payrolls.length
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
                총 근무 시간
              </Typography>
              <Typography variant="h4">
                {payrolls.reduce((sum, p) => sum + p.totalHours, 0)}시간
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: getUnconfirmedCount() > 0 ? "warning.50" : undefined,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                급여 확정 상태
                {getUnconfirmedCount() > 0 && (
                  <WarningIcon color="warning" sx={{ ml: 1 }} />
                )}
              </Typography>
              <Typography variant="h4">
                {getUnconfirmedCount() > 0 ? (
                  <Typography variant="h4" color="warning.main">
                    급여 미확정: {getUnconfirmedCount()}명
                  </Typography>
                ) : (
                  <Typography
                    variant="h4"
                    color="success.main"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    모두 확정됨
                    <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                  </Typography>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 액션 버튼 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        {getUnconfirmedCount() > 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={() => setConfirmDialogOpen(true)}
          >
            급여 확정
          </Button>
        )}
      </Box>

      {/* 급여 테이블 */}
      <Paper sx={{ width: "100%", overflow: "hidden", mb: 4 }}>
        {getUnconfirmedCount() > 0 && (
          <Alert severity="warning" sx={{ borderRadius: 0 }}>
            ⚠️ 급여 미확정: {getUnconfirmedCount()}명 (확정 필요)
          </Alert>
        )}
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>알바생</TableCell>
              <TableCell>근무 시간</TableCell>
              <TableCell>기본 급여</TableCell>
              <TableCell>추가 수당</TableCell>
              <TableCell>공제</TableCell>
              <TableCell>최종 급여</TableCell>
              <TableCell>상태</TableCell>
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
            ) : payrolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  급여 데이터가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              payrolls.map((payroll, index) => {
                const finalPay =
                  payroll.wage + payroll.extraPay - payroll.deduction;
                const employee = employees.find(
                  (emp) => emp.id === payroll.employeeId
                );

                return (
                  <TableRow
                    key={payroll.employeeId}
                    hover
                    onClick={() => handleOpenPayrollDetails(payroll)}
                    sx={{
                      bgcolor: !payroll.confirmed ? "warning.50" : undefined,
                    }}
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
                          {payroll.employeeName.charAt(0)}
                        </Avatar>
                        <Typography>{payroll.employeeName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{payroll.totalHours}시간</TableCell>
                    <TableCell>₩{payroll.wage.toLocaleString()}</TableCell>
                    <TableCell>
                      {payroll.extraPay > 0 ? (
                        <Tooltip
                          title={payroll.extraPayDetails
                            .map(
                              (d) =>
                                `${d.reason}: ₩${d.amount.toLocaleString()}`
                            )
                            .join(", ")}
                        >
                          <Typography color="success.main">
                            +₩{payroll.extraPay.toLocaleString()}
                          </Typography>
                        </Tooltip>
                      ) : (
                        "₩0"
                      )}
                    </TableCell>
                    <TableCell>
                      {payroll.deduction > 0 ? (
                        <Tooltip
                          title={payroll.deductionDetails
                            .map(
                              (d) =>
                                `${d.reason}: ₩${d.amount.toLocaleString()}`
                            )
                            .join(", ")}
                        >
                          <Typography color="error.main">
                            -₩{payroll.deduction.toLocaleString()}
                          </Typography>
                        </Tooltip>
                      ) : (
                        "₩0"
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ₩{finalPay.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {payroll.confirmed ? (
                          <Chip label="확정됨" color="success" size="small" />
                        ) : (
                          <Chip label="미확정" color="warning" size="small" />
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={payroll.paid}
                              onChange={(e) => {
                                e.stopPropagation();
                                handlePaidStatusChange(index);
                              }}
                              size="small"
                              disabled={!payroll.confirmed}
                            />
                          }
                          label={
                            <Typography
                              variant="caption"
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              {payroll.paid ? "💰 지급 완료" : "지급 대기"}
                            </Typography>
                          }
                          onClick={(e) => e.stopPropagation()}
                          sx={{ m: 0 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="급여 수정">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIndex(index);
                            setCurrentEmployee(payroll);
                          }}
                          disabled={payroll.confirmed}
                        >
                          <EditIcon fontSize="small" />
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

      {/* 급여 확정 다이얼로그 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>급여 확정</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            모든 급여를 확정하시겠습니까? 확정 후에는 수정이 불가능합니다.
          </DialogContentText>
          <Alert severity="warning" sx={{ mb: 2 }}>
            총 {getUnconfirmedCount()}명의 급여가 미확정 상태입니다.
          </Alert>
          <FormControlLabel
            control={
              <Switch
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
              />
            }
            label="알바생에게 급여 확정 알림 전송"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleConfirmPayroll}
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
          >
            급여 확정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 급여 상세 정보 다이얼로그 */}
      <Dialog
        open={payrollDetailDialogOpen}
        onClose={() => setPayrollDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEmployee && selectedPayroll && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {selectedEmployee.name.charAt(0)}
                </Avatar>
                <Typography variant="h6">
                  {selectedEmployee.name} 급여 정보
                </Typography>
                {selectedPayroll.confirmed && (
                  <Chip
                    label="확정됨"
                    color="success"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={detailsTabValue}
                  onChange={handleTabChange}
                  aria-label="payroll details tabs"
                >
                  <Tab
                    label="급여 요약"
                    icon={<PaymentIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="근무 시간 변화"
                    icon={<AccessTimeIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="급여 내역"
                    icon={<TimelineIcon />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              {/* 급여 요약 탭 */}
              {detailsTabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    급여 정보
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">기본 급여</Typography>
                        <Typography variant="h4">
                          ₩{selectedPayroll.wage.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          시급: ₩{selectedEmployee.hourlyRate.toLocaleString()}{" "}
                          × {selectedPayroll.totalHours}시간
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">추가 수당</Typography>
                        <Typography
                          variant="h4"
                          color={
                            selectedPayroll.extraPay > 0
                              ? "success.main"
                              : undefined
                          }
                        >
                          +₩{selectedPayroll.extraPay.toLocaleString()}
                        </Typography>
                        {selectedPayroll.extraPayDetails.length > 0 ? (
                          <List dense disablePadding>
                            {selectedPayroll.extraPayDetails.map(
                              (detail, idx) => (
                                <ListItem key={idx} disablePadding>
                                  <ListItemText
                                    primary={`${
                                      detail.reason
                                    }: +₩${detail.amount.toLocaleString()}`}
                                  />
                                </ListItem>
                              )
                            )}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            추가 수당 없음
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">공제</Typography>
                        <Typography
                          variant="h4"
                          color={
                            selectedPayroll.deduction > 0
                              ? "error.main"
                              : undefined
                          }
                        >
                          -₩{selectedPayroll.deduction.toLocaleString()}
                        </Typography>
                        {selectedPayroll.deductionDetails.length > 0 ? (
                          <List dense disablePadding>
                            {selectedPayroll.deductionDetails.map(
                              (detail, idx) => (
                                <ListItem key={idx} disablePadding>
                                  <ListItemText
                                    primary={`${
                                      detail.reason
                                    }: -₩${detail.amount.toLocaleString()}`}
                                  />
                                </ListItem>
                              )
                            )}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            공제 없음
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>

                  <Paper sx={{ p: 2, mt: 3 }}>
                    <Typography variant="h5" gutterBottom>
                      최종 급여
                    </Typography>
                    <Typography variant="h3">
                      ₩
                      {(
                        selectedPayroll.wage +
                        selectedPayroll.extraPay -
                        selectedPayroll.deduction
                      ).toLocaleString()}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ mr: 2 }}>
                        지급 상태:
                      </Typography>
                      {selectedPayroll.paid ? (
                        <Chip label="💰 지급 완료" color="success" />
                      ) : (
                        <Chip label="지급 대기" color="default" />
                      )}
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* 근무 시간 변화 탭 */}
              {detailsTabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    이번 달 주간 근무 시간
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    {getWeeklyHoursData(selectedEmployee.id).map(
                      (weekData, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1">
                            {weekData.week}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: `${(weekData.hours / 40) * 100}%`,
                                maxWidth: "100%",
                                height: 20,
                                bgcolor: "primary.main",
                                borderRadius: 1,
                                mr: 2,
                              }}
                            />
                            <Typography>{weekData.hours}시간</Typography>
                          </Box>
                        </Box>
                      )
                    )}
                  </Paper>

                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                    근무 시간 변화
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    지난 달 대비 총 근무 시간이 5% 증가했습니다.
                  </Alert>
                </Box>
              )}

              {/* 급여 내역 탭 */}
              {detailsTabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    급여 내역
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>월</TableCell>
                        <TableCell>근무 시간</TableCell>
                        <TableCell>총 급여</TableCell>
                        <TableCell>지급 상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getPayrollHistory(selectedEmployee.id).map(
                        (history, index) => (
                          <TableRow key={index}>
                            <TableCell>{history.month}</TableCell>
                            <TableCell>{history.totalHours}시간</TableCell>
                            <TableCell>
                              ₩{history.totalPay.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {history.paid ? (
                                <Chip
                                  label="지급 완료"
                                  color="success"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label="지급 대기"
                                  color="default"
                                  size="small"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPayrollDetailDialogOpen(false)}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 기존 다이얼로그 및 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PayrollPage;
