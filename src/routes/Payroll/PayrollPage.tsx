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
  getCalendarEvents,
  getBranchWorkers,
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

      console.log(
        `급여 데이터 조회: 브랜치 ID ${selectedBranchId}, 기간 ${startDateStr} ~ ${endDateStr}`
      );

      // API 호출
      const [summaryData, totalData, storeData] = await Promise.all([
        getSalariesSummary(selectedBranchId, startDateStr, endDateStr).catch(
          (err) => {
            console.error(
              `급여 요약 목록 조회 실패 [${startDateStr}~${endDateStr}]:`,
              err
            );
            setSnackbar({
              open: true,
              message:
                "급여 요약 데이터를 불러오지 못했습니다. 다시 시도해주세요.",
              severity: "warning",
            });
            return [] as SalarySummary[];
          }
        ),
        getSalaryTotal(selectedBranchId, startDateStr, endDateStr).catch(
          (err) => {
            console.error(
              `급여 총계 조회 실패 [${startDateStr}~${endDateStr}]:`,
              err
            );
            setSnackbar({
              open: true,
              message:
                "급여 총계 데이터를 불러오지 못했습니다. 로컬 계산 결과가 대신 사용됩니다.",
              severity: "warning",
            });
            return null;
          }
        ),
        getStoreInfo().catch((err) => {
          console.error("매장 정보 조회 실패:", err);
          return null;
        }),
      ]);

      // 브랜치 직원 목록 조회 - getBranchWorkers API 사용
      let employeesData: Employee[] = [];
      try {
        const branchWorkers = await getBranchWorkers(selectedBranchId);
        console.log(
          `브랜치 ID ${selectedBranchId}의 직원 ${branchWorkers.length}명 조회 성공:`,
          branchWorkers
        );

        // BranchWorker 형식을 Employee 형식으로 변환
        employeesData = branchWorkers.map((worker) => ({
          id: worker.userId || `temp-${Date.now()}`,
          name: worker.name,
          role: worker.roles || "",
          hourlyRate:
            typeof worker.cost === "string"
              ? parseInt(worker.cost, 10)
              : worker.cost || 9860,
          email: worker.email || "",
          phoneNumber: worker.phoneNums || "",
          status:
            worker.status === "재직중" || worker.status === "active"
              ? "active"
              : ("inactive" as "active" | "inactive" | "pending"),
        }));

        console.log("변환된 직원 데이터:", employeesData);
      } catch (err) {
        console.error(
          `브랜치 ID ${selectedBranchId}의 직원 목록 조회 실패:`,
          err
        );
        employeesData = [];

        setSnackbar({
          open: true,
          message:
            "직원 정보를 불러오지 못했습니다. 급여 계산에 영향이 있을 수 있습니다.",
          severity: "warning",
        });
      }

      // 캘린더 일정 직접 가져오기 (getShifts 대신 사용)
      let shiftsData: Shift[] = [];
      try {
        // API 헬퍼 함수 사용하여 캘린더 이벤트 조회
        const calendarEvents = await getCalendarEvents(
          selectedBranchId,
          startDateStr,
          endDateStr
        );

        console.log("캘린더 일정 조회 결과:", calendarEvents);

        // 캘린더 이벤트를 Shift 형식으로 변환
        if (calendarEvents && calendarEvents.length > 0) {
          shiftsData = calendarEvents.map((event: any) => {
            // workerId가 반드시 문자열로 변환되도록 함
            const workerId = event.workerId.toString();
            console.log(
              `캘린더 이벤트 변환: ID ${event.id}, 직원 ID ${workerId}, 이름 ${event.workerName}`
            );

            return {
              id: event.id.toString(),
              employeeIds: [workerId], // 명시적으로 직원 ID 문자열 저장
              start: event.startTime,
              end: event.endTime,
              shiftType: event.workType[0] || "regular",
              title: event.workerName,
              note: "",
              storeId: selectedBranchId,
              isRecurring: false,
              color:
                event.workType[0] === "open"
                  ? "#4CAF50"
                  : event.workType[0] === "middle"
                  ? "#2196F3"
                  : event.workType[0] === "close"
                  ? "#9C27B0"
                  : "#757575",
            };
          });
          console.log("변환된 근무 일정:", shiftsData);
        }
      } catch (err) {
        console.error("캘린더 일정 조회 실패:", err);
      }

      console.log("급여 요약 API 응답:", summaryData);
      console.log("급여 총계 API 응답:", totalData);
      console.log("직원 목록:", employeesData);

      // 상태 업데이트
      setSalarySummaries(summaryData);
      setSalaryTotal(totalData);
      setEmployees(employeesData);
      setShifts(shiftsData); // 변환된 근무 일정 저장
      setStoreInfo(storeData);

      // 직원 데이터 검증
      if (!employeesData || employeesData.length === 0) {
        console.error(
          "직원 데이터가 없습니다. 급여 계산을 진행할 수 없습니다."
        );
        setSnackbar({
          open: true,
          message:
            "직원 정보를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.",
          severity: "error",
        });
      }

      // 기존 계산 로직을 사용하여 이전 코드와의 호환성 유지
      if (summaryData.length === 0) {
        console.log(
          "API에서 급여 요약 데이터가 없습니다. 로컬 계산을 사용합니다."
        );
        generatePayrollData(
          employeesData,
          shiftsData,
          storeData,
          currentPeriod,
          setTotalEstimatedWage,
          setTotalWorkedHours
        );
      } else {
        console.log(
          `API에서 ${summaryData.length}명의 직원 급여 데이터를 가져왔습니다.`
        );
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
          console.log(
            `총 예상 인건비: ${totalData.totalPay.toLocaleString()}원 (기본급: ${totalData.totalRegularPay.toLocaleString()}원, 주휴수당: ${totalData.totalHolidayPay.toLocaleString()}원)`
          );
          console.log(
            `총 근무 시간: ${totalData.totalWorkHours} 시간, 총 직원 수: ${totalData.totalEmployees}명`
          );

          setTotalEstimatedWage(totalData.totalPay);
          setTotalWorkedHours(totalData.totalWorkHours);
        } else {
          console.warn("totalData가 null입니다. 로컬 계산 결과를 사용합니다.");
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("데이터 로드 중 오류:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다");
      setLoading(false);
      setSnackbar({
        open: true,
        message:
          "급여 데이터를 불러오는 데 실패했습니다. 네트워크 연결을 확인해주세요.",
        severity: "error",
      });
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

    console.log(
      `급여 계산 시작: ${employeesData.length}명의 직원, ${shiftsData.length}개의 근무 일정`
    );
    console.log("직원 데이터:", employeesData);

    // 근무 일정의 employeeIds 배열 확인
    shiftsData.forEach((shift) => {
      console.log(
        `근무 일정 ID ${shift.id}, 직원 IDs: [${shift.employeeIds.join(
          ", "
        )}], 시간: ${shift.start} ~ ${shift.end}`
      );
    });

    if (shiftsData.length === 0) {
      console.warn("근무 일정이 없어 급여 계산을 진행할 수 없습니다.");
      setPayrolls([]);
      setTotalWage(0);
      setTotalHours(0);
      return;
    }

    if (employeesData.length === 0) {
      console.warn("직원 데이터가 없어 급여 계산을 진행할 수 없습니다.");
      setPayrolls([]);
      setTotalWage(0);
      setTotalHours(0);
      return;
    }

    // 직원 ID를 문자열로 변환하여 비교하는 헬퍼 함수
    const isSameEmployee = (
      employeeId: string | number,
      workerId: string | number
    ) => {
      // 두 ID를 문자열로 변환하여 비교
      const result = employeeId.toString() === workerId.toString();
      console.log(
        `직원 ID 비교: ${employeeId} vs ${workerId} => ${
          result ? "일치" : "불일치"
        }`
      );
      return result;
    };

    const payrollData = employeesData.map((employee) => {
      // 직원의 ID는 employee.id가 아닌 employee.userId인 것으로 보임
      const employeeId = employee.id;
      console.log(`직원 ${employee.name} (ID: ${employeeId}) 처리 중`);

      const employeeShiftsInPeriod = shiftsData.filter((shift) => {
        try {
          const shiftStart = parseISO(shift.start);
          const isEmployeeMatch = shift.employeeIds.some((id) =>
            isSameEmployee(employeeId, id)
          );

          if (isEmployeeMatch) {
            console.log(
              `매칭된 근무 일정 발견: 직원 ${employee.name}, 근무 ID ${shift.id}, 시간 ${shift.start} ~ ${shift.end}`
            );
          }

          return (
            isEmployeeMatch &&
            isValid(shiftStart) && // Check if date is valid
            isWithinInterval(shiftStart, { start: periodStart, end: periodEnd })
          );
        } catch (e) {
          console.error(
            `Error processing shift ${shift.id} for employee ${employeeId}:`,
            e
          );
          return false;
        }
      });

      console.log(
        `직원 ${employee.name}의 근무 일정: ${employeeShiftsInPeriod.length}개`
      );

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
        actualHours * (employee.hourlyRate || storeData?.baseHourlyRate || 9000)
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
                (employee.hourlyRate || storeData?.baseHourlyRate || 9000)
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
        employeeId: employeeId,
        employeeName: employee.name,
        hourlyRate: employee.hourlyRate || storeData?.baseHourlyRate || 9000,
        scheduledHours: scheduledHours,
        actualHours: actualHours,
        basePay: basePay,
        holidayPay: holidayPay,
        finalPay: finalPay,
        shifts: shiftDetails,
        payday: calculatedPayday,
      };
    });

    console.log(
      `최종 급여 계산 결과: ${payrollData.length}명 직원, 총 ${monthTotalHours}시간, 총액 ${monthTotalWage}원`
    );

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

      console.log(
        `직원 급여 상세 조회: 브랜치 ID ${selectedBranchId}, 직원 ID ${userId}, 기간 ${startDateStr} ~ ${endDateStr}`
      );

      // API 호출
      const detailData = await getSalaryDetail(
        selectedBranchId,
        userId,
        startDateStr,
        endDateStr
      );

      console.log("직원 급여 상세 응답:", detailData);
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
        {currentBranch && (
          <Typography
            component="span"
            variant="subtitle1"
            sx={{ ml: 2, color: "text.secondary" }}
          >
            {currentBranch.name}
          </Typography>
        )}
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
          <IconButton
            onClick={() => handlePeriodChange("prev")}
            sx={{ color: "primary.main" }}
          >
            <KeyboardArrowLeftIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              mx: 2,
              minWidth: "150px",
              textAlign: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              px: 2,
              py: 0.5,
              borderRadius: 1,
              color: theme.palette.primary.main,
              fontWeight: 500,
            }}
          >
            {currentPeriodDisplay}
          </Typography>
          <IconButton
            onClick={() => handlePeriodChange("next")}
            sx={{ color: "primary.main" }}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        </Box>

        {/* 설정 버튼 */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DateRangeIcon />}
            onClick={() => setPeriodConfigOpen(true)}
            color="primary"
          >
            계산 기간 설정
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setPaydayDialogOpen(true)}
            color="primary"
          >
            지급일 설정 ({defaultPayday}일)
          </Button>
        </Box>
      </Box>

      {/* --- Summary Card --- */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "medium", color: "primary.main" }}
        >
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
                {loading ? (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                ) : error ? (
                  <Tooltip title="데이터 조회 오류">
                    <Typography
                      sx={{ color: "error.main", fontWeight: "bold" }}
                    >
                      오류 발생
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                      color: "success.main",
                    }}
                  >
                    ₩
                    {(
                      salaryTotal?.totalPay || totalEstimatedWage
                    ).toLocaleString()}
                  </Typography>
                )}
                {salaryTotal?.totalRegularPay &&
                  salaryTotal?.totalHolidayPay && (
                    <Tooltip
                      title={`기본급: ₩${salaryTotal.totalRegularPay.toLocaleString()}, 주휴수당: ₩${salaryTotal.totalHolidayPay.toLocaleString()}`}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          cursor: "help",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        (상세 내역 보기)
                      </Typography>
                    </Tooltip>
                  )}
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
                {loading ? (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                ) : error ? (
                  <Tooltip title="데이터 조회 오류">
                    <Typography
                      sx={{ color: "error.main", fontWeight: "bold" }}
                    >
                      오류 발생
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      color: "info.main",
                    }}
                  >
                    {formatTotalHours(
                      salaryTotal?.totalWorkHours || totalWorkedHours
                    )}
                  </Typography>
                )}
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
                {loading ? (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                ) : error ? (
                  <Tooltip title="데이터 조회 오류">
                    <Typography
                      sx={{ color: "error.main", fontWeight: "bold" }}
                    >
                      오류 발생
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      color: "secondary.main",
                    }}
                  >
                    {salaryTotal?.totalEmployees ||
                      payrolls.filter((p) => p.finalPay > 0).length}
                    명
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Payroll Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            직원 급여 목록
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {salarySummaries.length > 0 ? (
              <Chip
                label={`${salarySummaries.length}명의 직원`}
                size="small"
                color="primary"
                variant="outlined"
                icon={<PeopleAltIcon fontSize="small" />}
              />
            ) : null}
            {loading && <CircularProgress size={20} />}
          </Box>
        </Box>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  직원
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  시급
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  근무 시간
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  근무 급여
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  주휴수당
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  최종 급여
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  상세
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box
                      sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary">
                        급여 데이터를 불러오는 중...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Alert severity="error" sx={{ m: 2 }}>
                      {error}
                      <Button
                        size="small"
                        sx={{ ml: 2 }}
                        onClick={() =>
                          loadData(effectiveStartDate, effectiveEndDate)
                        }
                      >
                        다시 시도
                      </Button>
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box
                      sx={{
                        p: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <AccessTimeIcon
                        sx={{ fontSize: 48, color: "text.disabled" }}
                      />
                      <Typography variant="body1" color="text.secondary">
                        선택한 기간에 급여 데이터가 없습니다.
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        다른 날짜 범위를 선택하거나 직원들에게 근무 일정을
                        배정해주세요.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {payrolls.map((payroll) => (
                    <TableRow
                      key={payroll.employeeId}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 1.5,
                              bgcolor:
                                payroll.hourlyRate > 10000
                                  ? "success.light"
                                  : payroll.hourlyRate > 9800
                                  ? "primary.light"
                                  : "warning.light",
                            }}
                          >
                            {payroll.employeeName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>
                              {payroll.employeeName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {payroll.hourlyRate.toLocaleString()}원
                      </TableCell>
                      <TableCell align="right">
                        {payroll.actualHours > 0 ? (
                          <Chip
                            label={`${payroll.actualHours.toLocaleString()}시간`}
                            size="small"
                            color={
                              payroll.actualHours > 40 ? "success" : "default"
                            }
                            variant={
                              payroll.actualHours > 0 ? "filled" : "outlined"
                            }
                            sx={{ minWidth: 70 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {payroll.basePay > 0 ? (
                          payroll.basePay.toLocaleString() + "원"
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {payroll.holidayPay > 0 ? (
                          <Tooltip title="주 15시간 이상 근무시 발생">
                            <Typography>
                              {payroll.holidayPay.toLocaleString()}원
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {payroll.finalPay > 0 ? (
                          <Typography fontWeight="bold" color="primary">
                            {payroll.finalPay.toLocaleString()}원
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            0원
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="근무 상세 정보">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              handleViewDetails(payroll.employeeId)
                            }
                          >
                            <KeyboardArrowRightIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                    }}
                  >
                    <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                      합계 ({payrolls.length}명)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {formatTotalHours(
                        salaryTotal?.totalWorkHours || totalWorkedHours
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {(salaryTotal?.totalRegularPay || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {(salaryTotal?.totalHolidayPay || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      {(salaryTotal?.totalPay || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
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
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      mr: 1.5,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {selectedEmployee.employeeName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedEmployee.employeeName}님 급여 상세 내역
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentPeriodDisplay} 기간
                    </Typography>
                  </Box>
                </Box>
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
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ color: "primary.main", fontWeight: "medium" }}
                >
                  급여 요약
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        총 근무 시간
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 1,
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <AccessTimeIcon
                          sx={{ mr: 1, color: "info.main", fontSize: 20 }}
                        />
                        {(selectedEmployee?.actualHours || 0).toLocaleString()}
                        시간
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        시급
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 1,
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <MonetizationOnIcon
                          sx={{ mr: 1, color: "warning.main", fontSize: 20 }}
                        />
                        {(selectedEmployee?.hourlyRate || 0).toLocaleString()}원
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        height: "100%",
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
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <PaymentIcon
                          sx={{ mr: 1, color: "success.main", fontSize: 20 }}
                        />
                        {(selectedEmployee?.finalPay || 0).toLocaleString()}원
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 급여 계산 상세 - 먼저 표시 */}
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ color: "primary.main", fontWeight: "medium" }}
              >
                급여 계산 상세
              </Typography>

              <TableContainer
                sx={{
                  mt: 2,
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                      <TableCell sx={{ fontWeight: "bold" }}>항목</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        계산
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        금액
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>기본급</TableCell>
                      <TableCell align="right">
                        {selectedEmployee?.actualHours || 0} 시간 ×{" "}
                        {(selectedEmployee?.hourlyRate || 0).toLocaleString()}{" "}
                        원
                      </TableCell>
                      <TableCell align="right">
                        {(selectedEmployee?.basePay || 0).toLocaleString()} 원
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>주휴수당</TableCell>
                      <TableCell align="right">
                        주 {storeInfo?.weeklyHolidayHoursThreshold || 15}시간
                        이상 근무 기준
                      </TableCell>
                      <TableCell align="right">
                        {(selectedEmployee?.holidayPay || 0).toLocaleString()}{" "}
                        원
                      </TableCell>
                    </TableRow>
                    <TableRow
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                      <TableCell sx={{ fontWeight: "bold" }}>
                        최종 급여
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        기본급 + 주휴수당
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                        }}
                      >
                        {(selectedEmployee?.finalPay || 0).toLocaleString()} 원
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ color: "primary.main", fontWeight: "medium" }}
              >
                일별 근무 내역
              </Typography>

              {selectedEmployee.shifts.length > 0 ? (
                <TableContainer
                  sx={{
                    mt: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }}
                      >
                        <TableCell sx={{ fontWeight: "bold" }}>날짜</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>요일</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          근무 시간
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          근무 길이
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          근무 유형
                        </TableCell>
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
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setDetailDialogOpen(false)}
                color="primary"
                variant="outlined"
              >
                닫기
              </Button>
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
