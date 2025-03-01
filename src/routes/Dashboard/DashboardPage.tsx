// src/routes/Dashboard/DashboardPage.tsx
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
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
import { formatDistanceToNow } from "date-fns";
import { Employee, Shift, Store } from "../../lib/types";

function DashboardPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  // 색상 팔레트
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  // 가상의 매출 데이터
  const salesData = [
    { name: "월", 매출: 1200000, 지출: 900000 },
    { name: "화", 매출: 1650000, 지출: 980000 },
    { name: "수", 매출: 1350000, 지출: 950000 },
    { name: "목", 매출: 1400000, 지출: 970000 },
    { name: "금", 매출: 2100000, 지출: 1200000 },
    { name: "토", 매출: 2450000, 지출: 1300000 },
    { name: "일", 매출: 2200000, 지출: 1150000 },
  ];

  // 가상의 역할별 직원 수 데이터
  const roleData = [
    { name: "바리스타", value: 4 },
    { name: "홀 서빙", value: 3 },
    { name: "주방", value: 2 },
    { name: "매니저", value: 1 },
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
    {
      id: 4,
      message: "매출 리포트가 업데이트 되었습니다",
      time: new Date(Date.now() - 1000 * 60 * 60 * 48),
      type: "info",
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
                이번 주 배정률
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {calculateScheduleCompletionRate()}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateScheduleCompletionRate()}
                color={
                  calculateScheduleCompletionRate() < 60 ? "error" : "primary"
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <NotificationsIcon />
                </Avatar>
              </Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                대기 중인 대타 요청
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                3건
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <WarningIcon
                    fontSize="small"
                    color="warning"
                    sx={{ mr: 0.5 }}
                  />
                  긴급 요청 1건
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <AttachMoneyIcon />
                </Avatar>
              </Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                이번 달 예상 인건비
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {employees
                  .reduce((acc: number, emp: Employee) => {
                    const monthlyHours = 20 * 4; // 가정: 주당 20시간, 한 달 4주
                    return acc + emp.hourlyRate * monthlyHours;
                  }, 0)
                  .toLocaleString()}
                원
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <TrendingUpIcon
                  fontSize="small"
                  color="success"
                  sx={{ mr: 0.5 }}
                />
                전월 대비 5% 증가
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 차트와 데이터 분석 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="지난 주 매출 추이"
              subheader="일별 매출과 지출 현황"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) =>
                      `${Number(value).toLocaleString()}원`
                    }
                  />
                  <Bar dataKey="매출" fill={theme.palette.primary.main} />
                  <Bar dataKey="지출" fill={theme.palette.error.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardHeader title="직원 구성" subheader="역할별 인원 현황" />
            <Divider />
            <CardContent
              sx={{
                height: 320,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({
                      name,
                      percent,
                    }: {
                      name: string;
                      percent: number;
                    }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => `${value}명`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 알림 및 오늘의 일정 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="최근 알림"
              action={
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {}}
                >
                  모두 보기
                </Button>
              }
            />
            <Divider />
            <List>
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
                        ) : (
                          <NotificationsIcon />
                        )}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={formatDistanceToNow(notification.time, {
                        addSuffix: true,
                      })}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="오늘의 일정"
              subheader={new Date().toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
              action={
                <IconButton>
                  <CalendarTodayIcon />
                </IconButton>
              }
            />
            <Divider />
            <List>
              {shifts
                .filter((shift: Shift) => {
                  const shiftDate = new Date(shift.start);
                  const today = new Date();
                  return (
                    shiftDate.getDate() === today.getDate() &&
                    shiftDate.getMonth() === today.getMonth() &&
                    shiftDate.getFullYear() === today.getFullYear()
                  );
                })
                .map((shift: Shift, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <AccessTimeIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={shift.title}
                      secondary={`${new Date(shift.start).toLocaleTimeString(
                        "ko-KR",
                        { hour: "2-digit", minute: "2-digit" }
                      )} - ${new Date(shift.end).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                    />
                  </ListItem>
                ))}
              {shifts.filter((shift: Shift) => {
                const shiftDate = new Date(shift.start);
                const today = new Date();
                return (
                  shiftDate.getDate() === today.getDate() &&
                  shiftDate.getMonth() === today.getMonth() &&
                  shiftDate.getFullYear() === today.getFullYear()
                );
              }).length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="등록된 일정이 없습니다"
                    secondary="스케줄 관리에서 일정을 추가하세요"
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
