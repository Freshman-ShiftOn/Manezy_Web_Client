// src/routes/Dashboard/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  CircularProgress,
  LinearProgress,
  IconButton,
  Alert,
  Chip,
  useTheme,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  EventNote as EventNoteIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getEmployees, getShifts, getStoreInfo } from "../../services/api";
import {
  formatDistanceToNow,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  differenceInHours,
  isToday,
} from "date-fns";
import { Employee, Shift, Store } from "../../lib/types";

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  // 오늘 근무자 목록 계산
  const todaysWorkers = useMemo(() => {
    if (!shifts.length || !employees.length) return [];

    const todayShifts = shifts.filter((shift) =>
      isToday(new Date(shift.start))
    );

    const workerIds = new Set<string>();
    todayShifts.forEach((shift) => {
      shift.employeeIds.forEach((id) => workerIds.add(id));
    });

    return employees.filter((emp) => workerIds.has(emp.id));
  }, [shifts, employees]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // API에서 데이터 가져오기 (store, employees, shifts 정보 필요)
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

    loadData();
  }, []);

  // 로딩 상태 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          안녕하세요, {store?.name || "매장"}입니다
        </Typography>
        <Box>
          <Chip
            icon={<CalendarTodayIcon />}
            label={new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* 오늘 근무자 명단 표시 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          오늘 근무 예정 직원
        </Typography>
        {todaysWorkers.length > 0 ? (
          <Grid container spacing={2}>
            {todaysWorkers.map((employee) => (
              <Grid item key={employee.id} xs={6} sm={4} md={3}>
                <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ mr: 2, bgcolor: "primary.light" }}>
                    {employee.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      {employee.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {employee.role || "일반"}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            오늘 근무 예정인 직원이 없습니다.
          </Alert>
        )}
      </Box>
    </Box>
  );
}

export default DashboardPage;
