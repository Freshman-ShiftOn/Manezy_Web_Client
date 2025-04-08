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
import { getEmployees, getShifts, getStoreInfo } from "../../services/api";
import { Employee, Shift, Store } from "../../lib/types";
import {
  differenceInHours,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
} from "date-fns";
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
}

function PayrollPage() {
  const theme = useTheme();
  const [payrolls, setPayrolls] = useState<PayrollData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
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
        generatePayrollData(employeesData, shiftsData, storeData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generatePayrollData = (
    employeesData: Employee[],
    shiftsData: Shift[],
    storeData: Store | null
  ) => {
    const now = new Date();
    const periodStart = startOfMonth(now);
    const periodEnd = endOfMonth(now);
    const holidayThreshold = storeData?.weeklyHolidayHoursThreshold ?? 15;

    const payrollData = employeesData.map((employee) => {
      const employeeShiftsInPeriod = shiftsData.filter((shift) => {
        const shiftStart = new Date(shift.start);
        return (
          shift.employeeIds.includes(employee.id) &&
          isWithinInterval(shiftStart, { start: periodStart, end: periodEnd })
        );
      });

      const scheduledHours = employeeShiftsInPeriod.reduce(
        (sum, shift) =>
          sum + differenceInHours(new Date(shift.end), new Date(shift.start)),
        0
      );
      const actualHours = scheduledHours;
      const basePay = actualHours * employee.hourlyRate;

      let holidayPay = 0;
      const weeks = eachWeekOfInterval(
        { start: periodStart, end: periodEnd },
        { weekStartsOn: 1 }
      );
      let totalWeeklyHours = 0;
      let eligibleWeeks = 0;

      weeks.forEach((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const shiftsInWeek = employeeShiftsInPeriod.filter((shift) =>
          isWithinInterval(new Date(shift.start), {
            start: weekStart,
            end: weekEnd,
          })
        );
        const weeklyHours = shiftsInWeek.reduce(
          (sum, shift) =>
            sum + differenceInHours(new Date(shift.end), new Date(shift.start)),
          0
        );
        totalWeeklyHours += weeklyHours;
        if (weeklyHours >= holidayThreshold) {
          eligibleWeeks++;
          const avgDailyHours = weeklyHours / 5;
          holidayPay += avgDailyHours * employee.hourlyRate;
        }
      });

      holidayPay = Math.round(holidayPay);

      const finalPay = basePay + holidayPay;

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        hourlyRate: employee.hourlyRate,
        scheduledHours: scheduledHours,
        actualHours: actualHours,
        basePay: basePay,
        holidayPay: holidayPay,
        finalPay: finalPay,
      };
    });
    setPayrolls(payrollData);
  };

  const handleActualHoursChange = (employeeId: string, newHours: number) => {
    setPayrolls((prevPayrolls) =>
      prevPayrolls.map((p) => {
        if (p.employeeId === employeeId) {
          const newBasePay = newHours * p.hourlyRate;
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          급여 관리
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          에러 발생
        </Typography>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        급여 관리
      </Typography>

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>직원</TableCell>
                <TableCell align="right">시급</TableCell>
                <TableCell align="right">실제 시간</TableCell>
                <TableCell align="right">근무 급여</TableCell>
                <TableCell align="right">주휴수당</TableCell>
                <TableCell align="right">최종 급여</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls.map((payroll) => (
                <TableRow key={payroll.employeeId}>
                  <TableCell>{payroll.employeeName}</TableCell>
                  <TableCell align="right">
                    {payroll.hourlyRate.toLocaleString()}원
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      minWidth: 120,
                      background: alpha(theme.palette.info.light, 0.1),
                    }}
                  >
                    <TextField
                      type="number"
                      size="small"
                      variant="outlined"
                      value={payroll.actualHours}
                      onChange={(e) =>
                        handleActualHoursChange(
                          payroll.employeeId,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      sx={{ input: { textAlign: "right" } }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">시간</InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {payroll.basePay.toLocaleString()}원
                  </TableCell>
                  <TableCell align="right">
                    {payroll.holidayPay.toLocaleString()}원
                  </TableCell>
                  <TableCell align="right">
                    <strong>{payroll.finalPay.toLocaleString()}원</strong>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default PayrollPage;
