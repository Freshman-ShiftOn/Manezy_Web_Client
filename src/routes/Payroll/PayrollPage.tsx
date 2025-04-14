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
  TableContainer,
  Stack,
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
  Info as InfoIcon,
  CalendarMonth as CalendarMonthIcon,
  Event as EventIcon,
  EventNote as EventNoteIcon,
  BarChart as BarChartIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Close as CloseIcon,
  MonetizationOn as MonetizationOnIcon,
  PeopleAlt as PeopleAltIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
} from "@mui/icons-material";
import { getEmployees, getShifts, getStoreInfo } from "../../services/api";
import { Employee, Shift, Store } from "../../lib/types";
import {
  differenceInHours,
  differenceInMinutes,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  parseISO,
  isValid,
  addMonths,
  getMonth,
  getYear,
  setDate,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useTheme, alpha } from "@mui/material/styles";

interface PayrollData {
  employeeId: string;
  employeeName: string;
  hourlyRate: number;
  scheduledHours: number;
  actualHours: number;
  basePay: number;
  holidayPay: number;
  finalPay: number;
  shifts: ShiftDetail[];
  payday: Date;
}

interface ShiftDetail {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  duration: number;
  type?: string;
}

function PayrollPage() {
  const theme = useTheme();
  const [payrolls, setPayrolls] = useState<PayrollData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- New State Variables for Summary ---
  const [totalEstimatedWage, setTotalEstimatedWage] = useState<number>(0);
  const [totalWorkedHours, setTotalWorkedHours] = useState<number>(0);
  const [currentPeriodDisplay, setCurrentPeriodDisplay] = useState<string>("");
  // --- End New State Variables ---

  const [selectedEmployee, setSelectedEmployee] = useState<PayrollData | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<Date>(new Date());
  const [paydayDialogOpen, setPaydayDialogOpen] = useState(false);
  const [defaultPayday, setDefaultPayday] = useState<number>(15);

  useEffect(() => {
    // Update display string when period changes
    setCurrentPeriodDisplay(
      format(currentPeriod, "yyyy년 MM월", { locale: ko })
    );
    loadData(currentPeriod);
  }, [currentPeriod]); // Include currentPeriod in dependency array

  const loadData = async (periodDate: Date) => {
    try {
      setLoading(true);
      const [employeesData, shiftsData, storeData] = await Promise.all([
        getEmployees(),
        getShifts(),
        getStoreInfo(),
      ]);
      setEmployees(employeesData);
      setShifts(shiftsData);
      setStoreInfo(storeData);
      // Pass state setters to the calculation function
      generatePayrollData(
        employeesData,
        shiftsData,
        storeData,
        periodDate,
        setTotalEstimatedWage, // Pass setter
        setTotalWorkedHours // Pass setter
      );
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다");
      setLoading(false);
    }
  };

  const generatePayrollData = (
    employeesData: Employee[],
    shiftsData: Shift[],
    storeData: Store | null,
    periodDate: Date,
    // Receive state setters as arguments
    setTotalWage: React.Dispatch<React.SetStateAction<number>>,
    setTotalHours: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const periodStart = startOfMonth(periodDate);
    const periodEnd = endOfMonth(periodDate);
    const holidayThreshold = storeData?.weeklyHolidayHoursThreshold ?? 15;
    const calculatedPayday = setDate(addMonths(periodDate, 1), defaultPayday);

    let monthTotalWage = 0;
    let monthTotalHours = 0;

    const payrollData = employeesData.map((employee) => {
      const employeeShiftsInPeriod = shiftsData.filter((shift) => {
        try {
          const shiftStart = parseISO(shift.start);
          return (
            shift.employeeIds.includes(employee.id) &&
            isValid(shiftStart) && // Check if date is valid
            isWithinInterval(shiftStart, { start: periodStart, end: periodEnd })
          );
        } catch (e) {
          console.error(
            `Error processing shift ${shift.id} for employee ${employee.id}:`,
            e
          );
          return false;
        }
      });

      let scheduledHours = 0;
      try {
        scheduledHours = employeeShiftsInPeriod.reduce((sum, shift) => {
          // Use differenceInMinutes for potentially more accuracy, then convert to hours
          const minutes = differenceInMinutes(
            parseISO(shift.end),
            parseISO(shift.start)
          );
          return sum + minutes / 60;
        }, 0);
      } catch (e) {
        console.error("Error calculating scheduled hours:", e);
      }

      const actualHours = scheduledHours; // Assuming actual equals scheduled for now
      const basePay = Math.round(
        actualHours * (employee.hourlyRate || storeData?.baseHourlyRate || 0)
      );
      monthTotalHours += actualHours; // Accumulate total hours
      monthTotalWage += basePay; // Accumulate base pay

      let holidayPay = 0;
      try {
        const weeks = eachWeekOfInterval(
          { start: periodStart, end: periodEnd },
          { weekStartsOn: 1 } // Assuming week starts on Monday
        );
        weeks.forEach((weekStart) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const shiftsInWeek = employeeShiftsInPeriod.filter((shift) =>
            isWithinInterval(parseISO(shift.start), {
              start: weekStart,
              end: weekEnd,
            })
          );
          const weeklyHours = shiftsInWeek.reduce((sum, shift) => {
            const minutes = differenceInMinutes(
              parseISO(shift.end),
              parseISO(shift.start)
            );
            return sum + minutes / 60;
          }, 0);

          if (weeklyHours >= holidayThreshold) {
            // 주휴수당 계산: (주간 총 근무시간 / 40시간) * 8시간 * 시급 (단순화된 예시)
            // 또는: (주간 총 근무시간 / 소정근로일수) * 시급
            // 여기서는 주 5일 근무 가정, (weeklyHours / 5) * 시급 으로 계산
            const dailyAvgHours = weeklyHours / 5; // Assume 5 working days for simplicity
            holidayPay += Math.round(
              dailyAvgHours *
                (employee.hourlyRate || storeData?.baseHourlyRate || 0)
            );
          }
        });
      } catch (e) {
        console.error("Error calculating holiday pay:", e);
      }

      monthTotalWage += holidayPay; // Add holiday pay to total wage

      const finalPay = basePay + holidayPay;
      const shiftDetails: ShiftDetail[] = employeeShiftsInPeriod.map(
        (shift) => {
          const start = new Date(shift.start);
          const end = new Date(shift.end);

          return {
            id: shift.id,
            date: format(start, "yyyy-MM-dd"),
            dayOfWeek: format(start, "EEE", { locale: ko }),
            startTime: format(start, "HH:mm"),
            endTime: format(end, "HH:mm"),
            duration: differenceInMinutes(end, start),
            type: shift.shiftType,
          };
        }
      );

      shiftDetails.sort((a, b) => a.date.localeCompare(b.date));

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        hourlyRate: employee.hourlyRate,
        scheduledHours: scheduledHours,
        actualHours: actualHours,
        basePay: basePay,
        holidayPay: holidayPay,
        finalPay: finalPay,
        shifts: shiftDetails,
        payday: calculatedPayday,
      };
    });

    setPayrolls(payrollData);
    // Set the calculated totals
    setTotalWage(monthTotalWage);
    setTotalHours(monthTotalHours);
  };

  const handleActualHoursChange = (employeeId: string, newHours: number) => {
    setPayrolls((prevPayrolls) =>
      prevPayrolls.map((p) => {
        if (p.employeeId === employeeId) {
          const newBasePay = Math.round(newHours * p.hourlyRate);
          const newFinalPay = newBasePay + p.holidayPay;
          return {
            ...p,
            actualHours: newHours,
            basePay: newBasePay,
            finalPay: newFinalPay,
          };
        }
        return p;
      })
    );
  };

  const handlePeriodChange = (direction: "prev" | "next") => {
    setCurrentPeriod((prev) => {
      return direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1);
    });
  };

  const handleViewDetails = (employeeId: string) => {
    const employee = payrolls.find((p) => p.employeeId === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setDetailDialogOpen(true);
    }
  };

  const handlePaydayChange = (newPayday: number) => {
    setDefaultPayday(newPayday);
    loadData(currentPeriod);
    setPaydayDialogOpen(false);
  };

  const formatHoursAndMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins > 0 ? `${mins}분` : ""}`;
  };

  // Format total hours for display
  const formatTotalHours = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}시간 ${minutes}분`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          급여 관리
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          에러 발생
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        급여 관리
      </Typography>

      {/* Period Navigation and Payday Settings - Existing Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* ... period navigation buttons ... */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => handlePeriodChange("prev")}>
            <KeyboardArrowLeftIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ mx: 2, minWidth: "150px", textAlign: "center" }}
          >
            {currentPeriodDisplay}
          </Typography>
          <IconButton onClick={() => handlePeriodChange("next")}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </Box>
        {/* ... payday setting button ... */}
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => setPaydayDialogOpen(true)}
        >
          지급일 설정 ({defaultPayday}일)
        </Button>
      </Box>

      {/* --- NEW Summary Card --- */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "medium" }}>
          {currentPeriodDisplay} 급여 요약
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "success.light", mr: 1.5 }}>
                <MonetizationOnIcon
                  fontSize="small"
                  sx={{ color: "success.dark" }}
                />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  총 예상 인건비
                </Typography>
                <Typography sx={{ fontWeight: "bold" }}>
                  ₩{totalEstimatedWage.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "info.light", mr: 1.5 }}>
                <AccessTimeIcon fontSize="small" sx={{ color: "info.dark" }} />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  총 근무 시간
                </Typography>
                <Typography sx={{ fontWeight: "bold" }}>
                  {formatTotalHours(totalWorkedHours)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "secondary.light", mr: 1.5 }}>
                <PeopleAltIcon
                  fontSize="small"
                  sx={{ color: "secondary.dark" }}
                />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  급여 대상 직원 수
                </Typography>
                <Typography sx={{ fontWeight: "bold" }}>
                  {payrolls.filter((p) => p.finalPay > 0).length}명
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {/* --- End NEW Summary Card --- */}

      {/* Payroll Table - Existing Component */}
      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>직원</TableCell>
                <TableCell align="right">시급</TableCell>
                <TableCell align="right">근무 시간</TableCell>
                <TableCell align="right">근무 급여</TableCell>
                <TableCell align="right">주휴수당</TableCell>
                <TableCell align="right">최종 급여</TableCell>
                <TableCell align="center">상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      데이터가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((payroll) => (
                  <TableRow key={payroll.employeeId} hover>
                    <TableCell>{payroll.employeeName}</TableCell>
                    <TableCell align="right">
                      {payroll.hourlyRate.toLocaleString()}원
                    </TableCell>
                    <TableCell align="right">
                      {payroll.actualHours.toLocaleString()}시간
                    </TableCell>
                    <TableCell align="right">
                      {payroll.basePay.toLocaleString()}원
                    </TableCell>
                    <TableCell align="right">
                      {payroll.holidayPay.toLocaleString()}원
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        {payroll.finalPay.toLocaleString()}원
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="근무 상세 정보">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(payroll.employeeId)}
                        >
                          <KeyboardArrowRightIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEmployee && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">
                  {selectedEmployee.employeeName}님 근무 상세 내역
                </Typography>
                <IconButton
                  onClick={() => setDetailDialogOpen(false)}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {format(currentPeriod, "yyyy년 MM월", { locale: ko })} 근무
                  요약
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        총 근무 시간
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ mt: 1, fontWeight: "bold" }}
                      >
                        {selectedEmployee.actualHours.toLocaleString()}시간
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        시급
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ mt: 1, fontWeight: "bold" }}
                      >
                        {selectedEmployee.hourlyRate.toLocaleString()}원
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        최종 급여
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 1,
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                        }}
                      >
                        {selectedEmployee.finalPay.toLocaleString()}원
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                일별 근무 내역
              </Typography>

              {selectedEmployee.shifts.length > 0 ? (
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>날짜</TableCell>
                        <TableCell>요일</TableCell>
                        <TableCell>근무 시간</TableCell>
                        <TableCell>근무 길이</TableCell>
                        <TableCell>근무 유형</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEmployee.shifts.map((shift) => (
                        <TableRow key={shift.id} hover>
                          <TableCell>{shift.date}</TableCell>
                          <TableCell>{shift.dayOfWeek}</TableCell>
                          <TableCell>
                            {shift.startTime} - {shift.endTime}
                          </TableCell>
                          <TableCell>
                            {formatHoursAndMinutes(shift.duration)}
                          </TableCell>
                          <TableCell>
                            {shift.type ? (
                              <Chip
                                label={
                                  shift.type === "open"
                                    ? "오픈"
                                    : shift.type === "middle"
                                    ? "미들"
                                    : "마감"
                                }
                                size="small"
                                sx={{
                                  bgcolor:
                                    shift.type === "open"
                                      ? alpha("#4CAF50", 0.1)
                                      : shift.type === "middle"
                                      ? alpha("#2196F3", 0.1)
                                      : alpha("#9C27B0", 0.1),
                                  color:
                                    shift.type === "open"
                                      ? "#4CAF50"
                                      : shift.type === "middle"
                                      ? "#2196F3"
                                      : "#9C27B0",
                                }}
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  이 기간에 근무 내역이 없습니다.
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                급여 계산 상세
              </Typography>

              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>항목</TableCell>
                      <TableCell align="right">계산</TableCell>
                      <TableCell align="right">금액</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>기본급</TableCell>
                      <TableCell align="right">
                        {selectedEmployee.actualHours} 시간 ×{" "}
                        {selectedEmployee.hourlyRate.toLocaleString()} 원
                      </TableCell>
                      <TableCell align="right">
                        {selectedEmployee.basePay.toLocaleString()} 원
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>주휴수당</TableCell>
                      <TableCell align="right">
                        주 {storeInfo?.weeklyHolidayHoursThreshold || 15}시간
                        이상 근무 기준
                      </TableCell>
                      <TableCell align="right">
                        {selectedEmployee.holidayPay.toLocaleString()} 원
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ fontWeight: "bold" }}>
                      <TableCell>최종 급여</TableCell>
                      <TableCell align="right">기본급 + 주휴수당</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                        }}
                      >
                        {selectedEmployee.finalPay.toLocaleString()} 원
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={paydayDialogOpen}
        onClose={() => setPaydayDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>급여일 설정</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            매월 급여가 지급되는 날짜를 선택하세요.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>급여일</InputLabel>
            <Select
              value={defaultPayday}
              onChange={(e) => handlePaydayChange(Number(e.target.value))}
              label="급여일"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <MenuItem key={day} value={day}>
                  {day}일
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaydayDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={() => handlePaydayChange(defaultPayday)}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PayrollPage;
