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
} from "date-fns";
import { Employee, Shift, Store } from "../../lib/types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function DashboardPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // 색상 팔레트
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  // 알림 데이터
  const notifications = [
    {
      id: 1,
      message: "민수 알바생의 대타 요청이 있습니다",
      time: new Date(Date.now() - 1000 * 60 * 30),
      type: "warning",
    },
    {
      id: 2,
      message: "이번 주 근무표가 완성되었습니다",
      time: new Date(Date.now() - 1000 * 60 * 60 * 3),
      type: "info",
    },
    {
      id: 3,
      message: "하은 알바생의 급여 이체가 완료되었습니다",
      time: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: "success",
    },
  ];

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

    loadData();
  }, []);

  // 탭 변경 처리
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 이번 주 근무 시간 계산
  const weeklyScheduleSummary = useMemo(() => {
    if (!shifts.length || !employees.length) return [];

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 월요일부터 시작
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return employees
      .map((employee) => {
        // 이번 주 근무 필터링
        const employeeShifts = shifts.filter((shift) => {
          const shiftStart = new Date(shift.start);
          return (
            shift.employeeIds.includes(employee.id) &&
            isWithinInterval(shiftStart, { start: weekStart, end: weekEnd })
          );
        });

        // 총 근무 시간 계산
        const totalHours = employeeShifts.reduce((sum, shift) => {
          return (
            sum + differenceInHours(new Date(shift.end), new Date(shift.start))
          );
        }, 0);

        return {
          employee,
          totalHours,
          shiftsCount: employeeShifts.length,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours); // 많은 시간순으로 정렬
  }, [shifts, employees]);

  // 이번 달 근무 시간 계산
  const monthlyScheduleSummary = useMemo(() => {
    if (!shifts.length || !employees.length) return [];

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return employees
      .map((employee) => {
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
          employee,
          totalHours,
          shiftsCount: employeeShifts.length,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours); // 많은 시간순으로 정렬
  }, [shifts, employees]);

  // 총 예정 근무 시간 (이번 주)
  const totalWeeklyHours = weeklyScheduleSummary.reduce(
    (sum, item) => sum + item.totalHours,
    0
  );

  // 총 예정 근무 시간 (이번 달)
  const totalMonthlyHours = monthlyScheduleSummary.reduce(
    (sum, item) => sum + item.totalHours,
    0
  );

  // 이번 주 배정률 계산
  const calculateScheduleCompletionRate = () => {
    if (!shifts || shifts.length === 0) return 0;

    const totalSlots = 7 * 12; // 일주일 * 영업시간(12시간)
    const filledSlots = shifts.reduce((acc: number, shift: Shift) => {
      const hours =
        (new Date(shift.end).getTime() - new Date(shift.start).getTime()) /
        (1000 * 60 * 60);
      return acc + hours;
    }, 0);

    return Math.min(100, Math.round((filledSlots / totalSlots) * 100));
  };

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
          안녕하세요, {store?.name || "매장"} 대시보드입니다
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

      {/* 주요 지표 카드들 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <PersonIcon />
                </Avatar>
              </Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                알바생 등록 현황
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {employees.length}명
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <Chip
                  size="small"
                  label={`재직 중: ${
                    employees.filter((e: Employee) => e.status === "active")
                      .length
                  }명`}
                  color="success"
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                일정 배정 현황
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {calculateScheduleCompletionRate()}%
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LinearProgress
                  variant="determinate"
                  value={calculateScheduleCompletionRate()}
                  sx={{ flexGrow: 1, mr: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <TodayIcon />
                </Avatar>
              </Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                이번 주 총 근무시간
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {totalWeeklyHours}시간
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <Chip
                  size="small"
                  label={`알바생 평균: ${
                    employees.length
                      ? Math.round(totalWeeklyHours / employees.length)
                      : 0
                  }시간`}
                  color="info"
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <DateRangeIcon />
                </Avatar>
              </Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                이번 달 총 근무시간
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {totalMonthlyHours}시간
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <Chip
                  size="small"
                  label={`알바생 평균: ${
                    employees.length
                      ? Math.round(totalMonthlyHours / employees.length)
                      : 0
                  }시간`}
                  color="warning"
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 근무 시간 요약 */}
      <Grid container spacing={3}>
        {/* 알바생 근무 시간 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="알바생 근무 시간"
              action={
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="standard"
                >
                  <Tab
                    icon={<TodayIcon fontSize="small" />}
                    label="이번 주"
                    id="tab-weekly"
                    aria-controls="tabpanel-weekly"
                  />
                  <Tab
                    icon={<DateRangeIcon fontSize="small" />}
                    label="이번 달"
                    id="tab-monthly"
                    aria-controls="tabpanel-monthly"
                  />
                </Tabs>
              }
            />
            <Divider />
            <CardContent>
              <TabPanel value={tabValue} index={0}>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>알바생</TableCell>
                        <TableCell align="right">근무 시간</TableCell>
                        <TableCell align="right">근무 횟수</TableCell>
                        <TableCell align="right">시급</TableCell>
                        <TableCell align="right">예상 급여</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {weeklyScheduleSummary.map((item) => (
                        <TableRow key={item.employee.id}>
                          <TableCell component="th" scope="row">
                            {item.employee.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.totalHours}시간
                          </TableCell>
                          <TableCell align="right">
                            {item.shiftsCount}회
                          </TableCell>
                          <TableCell align="right">
                            {item.employee.hourlyRate.toLocaleString()}원
                          </TableCell>
                          <TableCell align="right">
                            {(
                              item.totalHours * item.employee.hourlyRate
                            ).toLocaleString()}
                            원
                          </TableCell>
                        </TableRow>
                      ))}
                      {weeklyScheduleSummary.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            이번 주 근무 데이터가 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>알바생</TableCell>
                        <TableCell align="right">근무 시간</TableCell>
                        <TableCell align="right">근무 횟수</TableCell>
                        <TableCell align="right">시급</TableCell>
                        <TableCell align="right">예상 급여</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyScheduleSummary.map((item) => (
                        <TableRow key={item.employee.id}>
                          <TableCell component="th" scope="row">
                            {item.employee.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.totalHours}시간
                          </TableCell>
                          <TableCell align="right">
                            {item.shiftsCount}회
                          </TableCell>
                          <TableCell align="right">
                            {item.employee.hourlyRate.toLocaleString()}원
                          </TableCell>
                          <TableCell align="right">
                            {(
                              item.totalHours * item.employee.hourlyRate
                            ).toLocaleString()}
                            원
                          </TableCell>
                        </TableRow>
                      ))}
                      {monthlyScheduleSummary.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            이번 달 근무 데이터가 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="최근 알림"
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />}>
                  전체보기
                </Button>
              }
            />
            <Divider />
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor:
                            notification.type === "warning"
                              ? "warning.main"
                              : notification.type === "success"
                              ? "success.main"
                              : "info.main",
                        }}
                      >
                        {notification.type === "warning" ? (
                          <WarningIcon />
                        ) : notification.type === "success" ? (
                          <NotificationsIcon />
                        ) : (
                          <EventNoteIcon />
                        )}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={formatDistanceToNow(notification.time, {
                        addSuffix: true,
                        locale: {
                          ...{},
                          formatDistance: (token, count) => {
                            const units: Record<string, string> = {
                              xSeconds: `${count}초 전`,
                              xMinutes: `${count}분 전`,
                              xHours: `${count}시간 전`,
                              xDays: `${count}일 전`,
                            };
                            return units[token] || `${count} ${token}`;
                          },
                        },
                      })}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
