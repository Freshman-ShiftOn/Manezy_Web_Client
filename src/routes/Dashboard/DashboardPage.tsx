// src/routes/Dashboard/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Grid,
  Paper,
} from "@mui/material";
import { CalendarToday as CalendarTodayIcon } from "@mui/icons-material";
import { getStoreInfo, getShifts, getEmployees } from "../../services/api"; // 필요한 API 호출
import { Store, Shift, Employee } from "../../lib/types";
import { isToday } from "date-fns";

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // 데이터 로드 (Store, Shifts, Employees)
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

  // 오늘 근무자 목록 계산 (유지)
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
      {/* 상단: 환영 메시지 및 날짜 */}
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

      {/* 오늘 근무자 명단 표시 (유지) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          오늘 근무 예정 직원
        </Typography>
        {todaysWorkers.length > 0 ? (
          <Grid container spacing={2}>
            {todaysWorkers.map((employee) => (
              <Grid item key={employee.id} xs={6} sm={4} md={3} lg={2}>
                {" "}
                {/* Grid 크기 조정 */}
                <Paper sx={{ p: 1.5, display: "flex", alignItems: "center" }}>
                  {" "}
                  {/* 패딩 조정 */}
                  <Avatar
                    sx={{
                      mr: 1.5,
                      width: 32,
                      height: 32,
                      fontSize: "0.875rem",
                    }}
                  >
                    {" "}
                    {/* 크기/마진 조정 */}
                    {employee.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {employee.name}
                    </Typography>{" "}
                    {/* 폰트 크기 조정 */}
                    <Typography variant="caption" color="text.secondary">
                      {employee.role || "일반"}
                    </Typography>{" "}
                    {/* 폰트 크기 조정 */}
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
