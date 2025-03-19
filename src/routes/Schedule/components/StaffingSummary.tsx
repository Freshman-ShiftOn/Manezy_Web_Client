import React, { useMemo, useState } from "react";
import { Box, Typography, Paper, Tooltip, Tabs, Tab } from "@mui/material";
import { alpha } from "@mui/material/styles";

// 요일 이름 (한글)
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 시간대 간격 (30분)
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

// 화면에 표시할 시간대 (예: 오전 8시부터 오후 10시까지)
const DISPLAY_START_INDEX = 16; // 8:00
const DISPLAY_END_INDEX = 44; // 22:00

interface EmployeeAvailabilityData {
  id: string;
  name: string;
  availability: {
    [day: number]: {
      // 시간대(0-47)별 가용성: 0=설정안됨, 1=불가능, 2=가능, 3=선호
      slots: number[];
    };
  };
}

interface StaffingSummaryProps {
  data: EmployeeAvailabilityData[];
}

type DayTab = "average" | 0 | 1 | 2 | 3 | 4 | 5 | 6;

const StaffingSummary: React.FC<StaffingSummaryProps> = ({ data }) => {
  const [selectedDay, setSelectedDay] = useState<DayTab>("average");

  // 각 요일/시간대별 가용 인력 계산
  const availabilityStats = useMemo(() => {
    const stats = Array(7)
      .fill(0)
      .map(() =>
        Array(TIME_SLOTS.length)
          .fill(0)
          .map(() => ({
            total: 0,
            available: 0,
            preferred: 0,
          }))
      );

    data.forEach((employee) => {
      // 모든 요일/시간대에 대해 기본적으로 총 인원수 증가
      for (let day = 0; day < 7; day++) {
        for (let slot = DISPLAY_START_INDEX; slot < DISPLAY_END_INDEX; slot++) {
          stats[day][slot].total++;

          // 해당 직원의 가용성 확인
          const dayData = employee.availability[day];
          if (dayData && dayData.slots[slot]) {
            const value = dayData.slots[slot];
            if (value === 2) {
              stats[day][slot].available++;
            } else if (value === 3) {
              stats[day][slot].preferred++;
              stats[day][slot].available++; // 선호도 있는 시간은 가용도 있음
            }
          }
        }
      }
    });

    return stats;
  }, [data]);

  // 시간대별 통계 계산 - 모든 요일 합산
  const timeSlotTotals = useMemo(() => {
    const result = Array(TIME_SLOTS.length)
      .fill(0)
      .map(() => ({
        total: 0,
        available: 0,
        preferred: 0,
      }));

    for (let slot = DISPLAY_START_INDEX; slot < DISPLAY_END_INDEX; slot++) {
      for (let day = 0; day < 7; day++) {
        result[slot].total += availabilityStats[day][slot].total;
        result[slot].available += availabilityStats[day][slot].available;
        result[slot].preferred += availabilityStats[day][slot].preferred;
      }
    }

    // 7로 나누어 평균 계산
    for (let slot = DISPLAY_START_INDEX; slot < DISPLAY_END_INDEX; slot++) {
      result[slot].total = Math.round(result[slot].total / 7);
      result[slot].available = Math.round(result[slot].available / 7);
      result[slot].preferred = Math.round(result[slot].preferred / 7);
    }

    return result;
  }, [availabilityStats]);

  // 시간대 포맷팅
  const formatTimeSlot = (index: number) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? "00" : "30";
    return `${hour}:${minute}`;
  };

  // 선택된 일자 또는 평균 데이터 가져오기
  const getSelectedDayData = () => {
    if (selectedDay === "average") {
      return timeSlotTotals;
    } else {
      return availabilityStats[selectedDay as number];
    }
  };

  // 요일 선택 핸들러
  const handleDayChange = (_: React.SyntheticEvent, newValue: DayTab) => {
    setSelectedDay(newValue);
  };

  // 현재 그래프 데이터
  const currentGraphData = getSelectedDayData();

  return (
    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          시간대별 가용 인력
        </Typography>

        <Tabs
          value={selectedDay}
          onChange={handleDayChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: "auto",
            "& .MuiTab-root": { minHeight: "auto", py: 0.5 },
          }}
        >
          <Tab label="평균" value="average" />
          {DAYS_OF_WEEK.map((day, index) => (
            <Tab key={day} label={day} value={index} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="caption" sx={{ mr: 2 }}>
          가용 인력:
        </Typography>
        <Box
          sx={{
            width: 12,
            height: 12,
            bgcolor: alpha("#2196F3", 0.6),
            mr: 0.5,
          }}
        />
        <Typography variant="caption" sx={{ mr: 2 }}>
          가능
        </Typography>
        <Box
          sx={{
            width: 12,
            height: 12,
            bgcolor: alpha("#4CAF50", 0.7),
            mr: 0.5,
          }}
        />
        <Typography variant="caption">선호</Typography>
      </Box>

      <Box sx={{ height: 250, display: "flex", position: "relative", mt: 2 }}>
        {/* Y축 (인원수) */}
        <Box sx={{ width: 30, height: "100%", position: "relative" }}>
          {[0, 25, 50, 75, 100].map((percent) => {
            const maxCount = Math.max(
              ...currentGraphData.map((s) => s.total || 0)
            );
            const value = Math.round((maxCount * percent) / 100);

            return (
              <React.Fragment key={percent}>
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: `${percent}%`,
                    right: 5,
                    transform: "translateY(50%)",
                    color: "text.secondary",
                  }}
                >
                  {value}
                </Typography>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: `${percent}%`,
                    left: 28,
                    right: -2,
                    height: 1,
                    bgcolor: percent > 0 ? "rgba(0,0,0,0.06)" : "divider",
                    zIndex: 0,
                  }}
                />
              </React.Fragment>
            );
          })}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: 1,
              bgcolor: "divider",
            }}
          />
        </Box>

        {/* 그래프 영역 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            height: "100%",
            ml: 1,
            position: "relative",
          }}
        >
          {/* 시간대 구분선 - 2시간 간격 */}
          {[10, 12, 14, 16, 18, 20].map((hour) => {
            const position = ((hour - 8) / (22 - 8)) * 100;
            return (
              <Box
                key={hour}
                sx={{
                  position: "absolute",
                  left: `${position}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  bgcolor: "rgba(0,0,0,0.06)",
                  zIndex: 0,
                }}
              />
            );
          })}

          {TIME_SLOTS.slice(DISPLAY_START_INDEX, DISPLAY_END_INDEX).map(
            (_, index) => {
              const actualIndex = index + DISPLAY_START_INDEX;
              const stats = currentGraphData[actualIndex];
              // 0으로 나누는 오류 방지
              const maxCount = Math.max(
                ...currentGraphData.map((s) => s.total || 1)
              );

              // 높이 계산 (최대값 기준)
              const availableHeight = stats
                ? (stats.available / maxCount) * 100
                : 0;
              const preferredHeight = stats
                ? (stats.preferred / maxCount) * 100
                : 0;

              // 유용도 계산 (총 인원 대비 가용 인원 비율)
              const availablePercentage =
                stats && stats.total > 0
                  ? (stats.available / stats.total) * 100
                  : 0;
              const preferredPercentage =
                stats && stats.total > 0
                  ? (stats.preferred / stats.total) * 100
                  : 0;

              // 색상 설정 - 인원 비율에 따라 투명도 조절
              const availableColor = alpha(
                "#2196F3",
                0.6 + availablePercentage / 250
              );
              const preferredColor = alpha(
                "#4CAF50",
                0.7 + preferredPercentage / 250
              );

              return (
                <Tooltip
                  key={index}
                  title={
                    <React.Fragment>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {formatTimeSlot(actualIndex)} 시간대
                      </Typography>
                      <Typography variant="body2">
                        총 {stats?.total || 0}명 중:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#2196F3" }}>
                        • 근무 가능: {stats?.available || 0}명 (
                        {Math.round(availablePercentage)}%)
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#4CAF50" }}>
                        • 근무 선호: {stats?.preferred || 0}명 (
                        {Math.round(preferredPercentage)}%)
                      </Typography>
                    </React.Fragment>
                  }
                >
                  <Box
                    sx={{
                      flex: 1,
                      position: "relative",
                      height: "100%",
                      "&:hover": {
                        bgcolor: alpha("#000", 0.03),
                      },
                      borderLeft:
                        index === 0 ? "1px solid rgba(0,0,0,0.08)" : "none",
                      borderRight: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* 가능 바 */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: "5%",
                        width: "90%",
                        height: `${availableHeight}%`,
                        bgcolor: availableColor,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1) inset",
                      }}
                    />
                    {/* 선호 바 */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: "5%",
                        width: "90%",
                        height: `${preferredHeight}%`,
                        bgcolor: preferredColor,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1) inset",
                      }}
                    />

                    {/* 매우 적은 인원일 경우 상단에 라벨 표시 */}
                    {availablePercentage < 25 && stats?.total > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          top: 2,
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.6rem",
                          color: "error.main",
                          fontWeight: "bold",
                        }}
                      >
                        !
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            }
          )}
        </Box>
      </Box>

      {/* X축 (시간) */}
      <Box sx={{ display: "flex", mt: 1, borderTop: "1px solid #eee", pt: 1 }}>
        <Box sx={{ width: 30 }} />
        <Box sx={{ flex: 1, display: "flex", position: "relative" }}>
          {[8, 10, 12, 14, 16, 18, 20, 22].map((hour) => {
            const position = ((hour - 8) / (22 - 8)) * 100;

            return (
              <Typography
                key={hour}
                variant="caption"
                sx={{
                  position: "absolute",
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                  color: "text.secondary",
                  fontWeight: hour % 2 === 0 ? "bold" : "normal",
                }}
              >
                {`${hour}:00`}
              </Typography>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {selectedDay === "average"
            ? "모든 요일 평균 가용 인력"
            : `${DAYS_OF_WEEK[selectedDay as number]}요일 가용 인력`}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: alpha("#2196F3", 0.7),
                mr: 0.5,
                borderRadius: 1,
              }}
            />
            <Typography variant="caption">가능 인원</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: alpha("#4CAF50", 0.8),
                mr: 0.5,
                borderRadius: 1,
              }}
            />
            <Typography variant="caption">선호 인원</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: "error.main",
                mr: 0.5,
                borderRadius: 1,
                fontSize: "0.7rem",
                color: "white",
                textAlign: "center",
                lineHeight: "12px",
              }}
            >
              !
            </Box>
            <Typography variant="caption">인원 부족</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default StaffingSummary;
