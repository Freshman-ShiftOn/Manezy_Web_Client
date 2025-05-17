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
  RadioGroup,
  Radio,
  FormLabel,
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
  Settings as SettingsIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  getEmployees,
  getShifts,
  getStoreInfo,
  getSalariesSummary,
  getSalaryDetail,
  getSalaryTotal,
} from "../../services/api";
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
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useTheme, alpha } from "@mui/material/styles";
import { useBranch } from "../../context/BranchContext";

// 급여 API 응답 타입
interface SalarySummary {
  userId: number;
  name: string;
  hourlyRate: number;
  workHours: number;
  regularPay: number;
  holidayPay: number;
  totalPay: number;
}

interface SalaryDetail {
  userId: number;
  name: string;
  hourlyRate: number;
  shifts: Array<{
    shiftId: number;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    type: string;
  }>;
  workHours: number;
  regularPay: number;
  holidayPay: number;
  totalPay: number;
}

interface SalaryTotal {
  totalEmployees: number;
  totalWorkHours: number;
  totalRegularPay: number;
  totalHolidayPay: number;
  totalPay: number;
}

// 기존 타입 (이전 코드와 호환성 유지)
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

// 급여 계산 기간 타입
type PayPeriodType = "monthly" | "custom";

function PayrollPage() {
  const theme = useTheme();

  // 브랜치 컨텍스트에서 현재 선택된 브랜치 정보 가져오기
  const { selectedBranchId, currentBranch } = useBranch();

  const [payrolls, setPayrolls] = useState<PayrollData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 급여 API 관련 상태
  const [salarySummaries, setSalarySummaries] = useState<SalarySummary[]>([]);
  const [salaryTotal, setSalaryTotal] = useState<SalaryTotal | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<SalaryDetail | null>(null);

  // 급여 계산 기간 관련 상태
  const [payPeriodType, setPayPeriodType] = useState<PayPeriodType>("monthly");
  const [periodConfigOpen, setPeriodConfigOpen] = useState(false);
  const [periodStartDay, setPeriodStartDay] = useState<number>(1); // 매월 1일
  const [periodEndDay, setPeriodEndDay] = useState<number>(31); // 매월 말일
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

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

  // 실제 계산에 사용되는 날짜 범위
  const [effectiveStartDate, setEffectiveStartDate] = useState<Date>(
    startOfMonth(new Date())
  );
  const [effectiveEndDate, setEffectiveEndDate] = useState<Date>(
    endOfMonth(new Date())
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  // 렌더링 시 초기화
  useEffect(() => {
    // 기본 기간 설정 (현재 달의 1일부터 말일까지)
    const today = new Date();
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);

    setEffectiveStartDate(firstDay);
    setEffectiveEndDate(lastDay);
    setCustomStartDate(format(firstDay, "yyyy-MM-dd"));
    setCustomEndDate(format(lastDay, "yyyy-MM-dd"));

    updatePeriodDisplay(firstDay, lastDay);
  }, []);

  useEffect(() => {
    // currentPeriod가 변경될 때 해당 월의 시작일과 끝일로 기간 갱신
    if (payPeriodType === "monthly") {
      const newStartDate = new Date(
        currentPeriod.getFullYear(),
        currentPeriod.getMonth(),
        periodStartDay
      );
      let newEndDate;

      // 말일 처리 (31일이 없는 달 고려)
      if (periodEndDay >= 28) {
        const lastDayOfMonth = endOfMonth(currentPeriod);
        newEndDate =
          periodEndDay >= lastDayOfMonth.getDate()
            ? lastDayOfMonth
            : new Date(
                currentPeriod.getFullYear(),
                currentPeriod.getMonth(),
                periodEndDay
              );
      } else {
        newEndDate = new Date(
          currentPeriod.getFullYear(),
          currentPeriod.getMonth(),
          periodEndDay
        );
      }

      // 시작일이 종료일보다 큰 경우(예: 16일~15일) 시작일은 전 달로 조정
      if (newStartDate > newEndDate) {
        newStartDate.setMonth(newStartDate.getMonth() - 1);
      }

      setEffectiveStartDate(startOfDay(newStartDate));
      setEffectiveEndDate(endOfDay(newEndDate));

      // 표시용 문자열 업데이트
      updatePeriodDisplay(newStartDate, newEndDate);

      // 데이터 로드
      loadData(newStartDate, newEndDate);
    }
  }, [currentPeriod, periodStartDay, periodEndDay, payPeriodType]);

  // 기간 표시 업데이트
  const updatePeriodDisplay = (startDate: Date, endDate: Date) => {
    // 같은 달인 경우
    if (
      isSameMonth(startDate, endDate) &&
      startDate.getDate() === 1 &&
      endDate.getDate() === endOfMonth(endDate).getDate()
    ) {
      setCurrentPeriodDisplay(format(startDate, "yyyy년 MM월", { locale: ko }));
    } else {
      setCurrentPeriodDisplay(
        `${format(startDate, "yyyy년 MM월 dd일", { locale: ko })} ~ ${format(
          endDate,
          "yyyy년 MM월 dd일",
          { locale: ko }
        )}`
      );
    }
  };

  // 커스텀 기간 설정 적용
  const applyCustomPeriod = () => {
    try {
      const startDate = parseISO(customStartDate);
      const endDate = parseISO(customEndDate);

      if (!isValid(startDate) || !isValid(endDate)) {
        throw new Error("유효하지 않은 날짜 형식입니다.");
      }

      if (startDate > endDate) {
        throw new Error("시작일은 종료일보다 이전이어야 합니다.");
      }

      setEffectiveStartDate(startOfDay(startDate));
      setEffectiveEndDate(endOfDay(endDate));
      updatePeriodDisplay(startDate, endDate);

      // 데이터 로드
      loadData(startDate, endDate);
      setPeriodConfigOpen(false);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "날짜 형식이 올바르지 않습니다.",
        severity: "error",
      });
    }
  };

  const loadData = async (startDate: Date, endDate: Date) => {
    if (!selectedBranchId) {
      setError("브랜치를 선택해주세요.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 날짜 형식 변환 (API 요청용)
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      // API 호출
      const [summaryData, totalData, employeesData, shiftsData, storeData] =
        await Promise.all([
          getSalariesSummary(selectedBranchId, startDateStr, endDateStr).catch(
            (err) => {
              console.error("급여 요약 목록 조회 실패:", err);
              return [] as SalarySummary[];
            }
          ),
          getSalaryTotal(selectedBranchId, startDateStr, endDateStr).catch(
            (err) => {
              console.error("급여 총계 조회 실패:", err);
              return null;
            }
          ),
          getEmployees(),
          getShifts(),
          getStoreInfo(),
        ]);

      // 상태 업데이트
      setSalarySummaries(summaryData);
      setSalaryTotal(totalData);
      setEmployees(employeesData);
      setShifts(shiftsData);
      setStoreInfo(storeData);

      // 기존 계산 로직을 사용하여 이전 코드와의 호환성 유지
      if (summaryData.length === 0) {
        generatePayrollData(
          employeesData,
          shiftsData,
          storeData,
          currentPeriod,
          setTotalEstimatedWage,
          setTotalWorkedHours
        );
      } else {
        // API 데이터를 기존 형식으로 변환
        const convertedPayrolls = summaryData.map((summary) => ({
          employeeId: summary.userId.toString(),
          employeeName: summary.name,
          hourlyRate: summary.hourlyRate,
          scheduledHours: summary.workHours,
          actualHours: summary.workHours,
          basePay: summary.regularPay,
          holidayPay: summary.holidayPay,
          finalPay: summary.totalPay,
          shifts: [], // 상세 조회 시 채워짐
          payday: setDate(addMonths(currentPeriod, 1), defaultPayday),
        }));

        setPayrolls(convertedPayrolls);

        // 요약 정보 업데이트
        if (totalData) {
          setTotalEstimatedWage(totalData.totalPay);
          setTotalWorkedHours(totalData.totalWorkHours);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("데이터 로드 중 오류:", err);
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
    loadEmployeeDetail(employeeId);
  };

  const handlePaydayChange = (newPayday: number) => {
    setDefaultPayday(newPayday);
    loadData(effectiveStartDate, effectiveEndDate);
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

  // 직원 급여 상세 정보 조회
  const loadEmployeeDetail = async (userId: string | number) => {
    if (!selectedBranchId) {
      setSnackbar({
        open: true,
        message: "브랜치를 먼저 선택해주세요.",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // 날짜 형식 변환
      const startDateStr = format(effectiveStartDate, "yyyy-MM-dd");
      const endDateStr = format(effectiveEndDate, "yyyy-MM-dd");

      // API 호출
      const detailData = await getSalaryDetail(
        selectedBranchId,
        userId,
        startDateStr,
        endDateStr
      );
      setSelectedUserDetail(detailData);

      // 기존 형식으로 변환하여 호환성 유지
      const employee = salarySummaries.find(
        (s) => s.userId.toString() === userId.toString()
      );
      if (employee) {
        // 상세 정보를 기존 형식으로 변환
        const convertedShifts: ShiftDetail[] = detailData.shifts.map(
          (shift) => ({
            id: shift.shiftId.toString(),
            date: shift.date,
            dayOfWeek: format(parseISO(shift.date), "EEE", { locale: ko }),
            startTime: shift.startTime,
            endTime: shift.endTime,
            duration: shift.duration,
            type: shift.type,
          })
        );

        setSelectedEmployee({
          employeeId: detailData.userId.toString(),
          employeeName: detailData.name,
          hourlyRate: detailData.hourlyRate,
          scheduledHours: detailData.workHours,
          actualHours: detailData.workHours,
          basePay: detailData.regularPay,
          holidayPay: detailData.holidayPay,
          finalPay: detailData.totalPay,
          shifts: convertedShifts,
          payday: setDate(addMonths(currentPeriod, 1), defaultPayday),
        });
      }

      setDetailDialogOpen(true);
      setLoading(false);
    } catch (err: any) {
      console.error("직원 급여 상세 정보 로드 오류:", err);
      setSnackbar({
        open: true,
        message:
          err.message ||
          "직원 급여 상세 정보를 불러오는 중 오류가 발생했습니다.",
        severity: "error",
      });
      setLoading(false);
    }
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

      {/* Period Navigation and Settings */}
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
        {/* 기간 탐색 버튼 */}
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

        {/* 설정 버튼 */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DateRangeIcon />}
            onClick={() => setPeriodConfigOpen(true)}
          >
            계산 기간 설정
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setPaydayDialogOpen(true)}
          >
            지급일 설정 ({defaultPayday}일)
          </Button>
        </Box>
      </Box>

      {/* --- Summary Card --- */}
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
                  ₩
                  {(
                    salaryTotal?.totalPay || totalEstimatedWage
                  ).toLocaleString()}
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
                  {formatTotalHours(
                    salaryTotal?.totalWorkHours || totalWorkedHours
                  )}
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
                  {salaryTotal?.totalEmployees ||
                    payrolls.filter((p) => p.finalPay > 0).length}
                  명
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Payroll Table */}
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

      {/* 계산 기간 설정 다이얼로그 */}
      <Dialog
        open={periodConfigOpen}
        onClose={() => setPeriodConfigOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">급여 계산 기간 설정</Typography>
            <IconButton onClick={() => setPeriodConfigOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">기간 설정 방식</FormLabel>
              <RadioGroup
                row
                value={payPeriodType}
                onChange={(e) =>
                  setPayPeriodType(e.target.value as PayPeriodType)
                }
              >
                <FormControlLabel
                  value="monthly"
                  control={<Radio />}
                  label="매월 고정 기간"
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="직접 지정"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {payPeriodType === "monthly" ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>시작일</InputLabel>
                  <Select
                    value={periodStartDay}
                    onChange={(e) => setPeriodStartDay(Number(e.target.value))}
                    label="시작일"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <MenuItem key={`start-${day}`} value={day}>
                        {day}일
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>종료일</InputLabel>
                  <Select
                    value={periodEndDay}
                    onChange={(e) => setPeriodEndDay(Number(e.target.value))}
                    label="종료일"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <MenuItem key={`end-${day}`} value={day}>
                        {day === 31 ? "말일" : `${day}일`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" variant="outlined">
                  {periodStartDay > periodEndDay
                    ? `매월 ${periodStartDay}일부터 다음 달 ${periodEndDay}일까지의 급여를 계산합니다.`
                    : `매월 ${periodStartDay}일부터 ${periodEndDay}일까지의 급여를 계산합니다.`}
                </Alert>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="시작일"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="종료일"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodConfigOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (payPeriodType === "custom") {
                applyCustomPeriod();
              } else {
                setPeriodConfigOpen(false);
              }
            }}
          >
            적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 직원 상세 정보 다이얼로그 유지 (기존과 동일) */}
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
                  {currentPeriodDisplay} 근무 요약
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

      {/* 급여일 설정 다이얼로그 유지 */}
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

      {/* 스낵바 추가 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PayrollPage;
