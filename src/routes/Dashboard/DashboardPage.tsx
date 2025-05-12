// src/routes/Dashboard/DashboardPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getEmployees, getShifts, getStoreInfo } from "../../services/api";
import { Employee, Shift, Store } from "../../lib/types";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import {
  format,
  isToday,
  parseISO,
  differenceInHours,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";

// Helper function to format time range
const formatTimeRange = (start: string, end: string): string => {
  try {
    const startTime = format(parseISO(start), "HH:mm");
    const endTime = format(parseISO(end), "HH:mm");
    return `${startTime} - ${endTime}`;
  } catch (error) {
    console.error("Error formatting time range:", error);
    return "시간 오류";
  }
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [todaysShifts, setTodaysShifts] = useState<Shift[]>([]);
  const [estimatedMonthlyWage, setEstimatedMonthlyWage] = useState<number>(0);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [storeData, employeeData, shiftData] = await Promise.all([
          getStoreInfo(),
          getEmployees(),
          getShifts(),
        ]);

        setStoreInfo(storeData);
        setEmployees(employeeData || []);
        setShifts(shiftData || []);

        // Filter today's shifts
        const today = new Date();
        const filteredTodaysShifts = (shiftData || []).filter((shift) =>
          isToday(parseISO(shift.start))
        );
        // Sort today's shifts by start time
        filteredTodaysShifts.sort(
          (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime()
        );
        setTodaysShifts(filteredTodaysShifts);

        // Calculate estimated monthly wage
        let totalWage = 0;
        const employeeMap = new Map(employeeData?.map((emp) => [emp.id, emp]));
        const currentMonthShifts = (shiftData || []).filter((shift) =>
          isSameMonth(parseISO(shift.start), today)
        );

        currentMonthShifts.forEach((shift) => {
          const start = parseISO(shift.start);
          const end = parseISO(shift.end);
          const hours = differenceInHours(end, start); // Note: This is a simple hour difference

          shift.employeeIds.forEach((empId) => {
            const employee = employeeMap.get(empId);
            if (employee) {
              totalWage +=
                hours * (employee.hourlyRate || storeData?.baseHourlyRate || 0);
            }
          });
        });
        setEstimatedMonthlyWage(totalWage);
      } catch (error) {
        console.error("대시보드 데이터 로딩 오류:", error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEmployeeName = (employeeId: string): string => {
    return employees.find((emp) => emp.id === employeeId)?.name || "미지정";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>대시보드 로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        {storeInfo?.name || "매장"} 대시보드
      </Typography>

      <Grid container spacing={3}>
        {/* Today's Schedule Card (Moved to top) */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{ bgcolor: "info.light", width: 40, height: 40, mr: 1.5 }}
                >
                  <CalendarTodayIcon sx={{ color: "info.dark" }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: "medium" }}
                  >
                    오늘의 근무 스케줄
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(), "yyyy년 MM월 dd일 (eee)", {
                      locale: ko,
                    })}
                  </Typography>
                </Box>
              </Box>

              {todaysShifts.length > 0 ? (
                <List disablePadding>
                  {todaysShifts.map((shift, index) => (
                    <React.Fragment key={shift.id}>
                      <ListItem disablePadding sx={{ py: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 50 }}>
                          <Chip
                            icon={<AccessTimeIcon fontSize="small" />}
                            label={formatTimeRange(shift.start, shift.end)}
                            size="small"
                            color={
                              shift.shiftType === "open"
                                ? "success"
                                : shift.shiftType === "close"
                                  ? "error"
                                  : "primary"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={shift.employeeIds
                            .map((id) => getEmployeeName(id))
                            .join(", ")}
                          secondary={shift.title || shift.shiftType || "근무"} // Show title or type
                          primaryTypographyProps={{ fontWeight: "medium" }}
                        />
                      </ListItem>
                      {index < todaysShifts.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography
                  sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
                >
                  오늘은 예정된 근무가 없습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estimated Monthly Wage Card (Now below) */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              height: "100%",
              borderRadius: 3,
              boxShadow: 3,
            }}
          >
            <Avatar
              sx={{ bgcolor: "success.light", width: 56, height: 56, mr: 2 }}
            >
              <MonetizationOnIcon sx={{ color: "success.dark" }} />
            </Avatar>
            <Box>
              <Typography color="text.secondary" gutterBottom variant="body2">
                이번 달 예상 인건비 (확정 스케줄 기준)
              </Typography>
              <Typography
                variant="h5"
                component="div"
                sx={{ fontWeight: "bold" }}
              >
                ₩{estimatedMonthlyWage.toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Quick Action Button Card (Now below) */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 2,
              height: "100%",
              borderRadius: 3,
              boxShadow: 3,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "medium" }}>
              빠른 작업
            </Typography>
            <Button
              variant="contained"
              startIcon={<EventIcon />}
              onClick={() => navigate("/schedule")} // Navigate to schedule page
              fullWidth
              size="large"
              sx={{ mt: 1 }}
            >
              주간 스케줄 보기 / 편집
            </Button>
            {/* Add more buttons if needed */}
            {/* <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => navigate("/employees")} fullWidth sx={{ mt: 1 }}>새 직원 등록</Button> */}
          </Card>
        </Grid>

        {/* Potential Future Widgets (Notifications, Team Overview, etc.) */}
        {/* <Grid item xs={12} md={6}> ... Notifications Card ... </Grid> */}
        {/* <Grid item xs={12} md={6}> ... Team Overview Card ... </Grid> */}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
