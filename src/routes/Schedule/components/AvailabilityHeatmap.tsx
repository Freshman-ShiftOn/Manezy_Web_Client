import React from "react";
import { Box, Typography, Paper, Tooltip, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";

// 요일 이름 (한글)
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 가용시간 선호도에 따른 색상
const PREFERENCE_COLORS = {
  preferred: "#4CAF50", // 녹색 (선호)
  available: "#2196F3", // 파란색 (가능)
  unavailable: "#F44336", // 빨간색 (불가능)
  unset: "#E0E0E0", // 회색 (설정 안됨)
};

// 시간대 간격 (30분)
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

// 화면에 표시할 시간대 (예: 오전 8시부터 오후 10시까지)
const DISPLAY_START_INDEX = 16; // 8:00
const DISPLAY_END_INDEX = 44; // 22:00

// 시간 포맷팅
const formatTimeLabel = (timeSlot: string) => {
  const [hour, minute] = timeSlot.split(":");
  return `${hour}:${minute}`;
};

// 히트맵 셀 스타일
const HeatmapCell = styled(Box)(({ theme }) => ({
  width: "100%",
  height: 20,
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    opacity: 0.8,
    transform: "scale(1.1)",
    zIndex: 1,
  },
}));

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

interface AvailabilityHeatmapProps {
  data: EmployeeAvailabilityData[];
  onCellClick?: (employeeId: string, day: number, slot: number) => void;
}

const AvailabilityHeatmap: React.FC<AvailabilityHeatmapProps> = ({
  data,
  onCellClick,
}) => {
  // 가용성 값을 색상으로 변환
  const getColorFromValue = (value: number) => {
    switch (value) {
      case 3:
        return PREFERENCE_COLORS.preferred;
      case 2:
        return PREFERENCE_COLORS.available;
      case 1:
        return PREFERENCE_COLORS.unavailable;
      default:
        return PREFERENCE_COLORS.unset;
    }
  };

  // 가용성 값을 텍스트로 변환
  const getStatusText = (value: number) => {
    switch (value) {
      case 3:
        return "선호";
      case 2:
        return "가능";
      case 1:
        return "불가능";
      default:
        return "설정 안됨";
    }
  };

  return (
    <Paper sx={{ p: 2, overflowX: "auto" }} variant="outlined">
      <Box sx={{ display: "flex", minWidth: 800 }}>
        {/* 왼쪽 직원명 칼럼 */}
        <Box sx={{ width: 120, flexShrink: 0, mr: 1 }}>
          <Box
            sx={{
              height: 40,
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            <Typography variant="body2">직원명</Typography>
          </Box>

          {data.map((employee) => (
            <Box
              key={employee.id}
              sx={{
                height: 20,
                display: "flex",
                alignItems: "center",
                my: 0.5,
              }}
            >
              <Typography variant="body2" noWrap>
                {employee.name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 히트맵 영역 */}
        <Box sx={{ flex: 1 }}>
          {/* 요일 헤더 */}
          <Box
            sx={{ display: "flex", height: 40, borderBottom: "1px solid #eee" }}
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <Box
                key={day}
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "bold",
                  borderRight:
                    index < DAYS_OF_WEEK.length - 1 ? "1px solid #eee" : "none",
                }}
              >
                <Typography variant="body2">{day}</Typography>
              </Box>
            ))}
          </Box>

          {/* 직원별 가용성 히트맵 */}
          {data.map((employee) => (
            <Box
              key={employee.id}
              sx={{
                display: "flex",
                my: 0.5,
                height: 20,
              }}
            >
              {/* 각 요일별 가용성 */}
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const dayData = employee.availability[day] || { slots: [] };

                return (
                  <Box
                    key={day}
                    sx={{
                      flex: 1,
                      display: "flex",
                      height: "100%",
                      borderRight: day < 6 ? "1px solid #eee" : "none",
                    }}
                  >
                    {/* 시간대별 가용성 */}
                    {TIME_SLOTS.slice(
                      DISPLAY_START_INDEX,
                      DISPLAY_END_INDEX
                    ).map((timeSlot, slotIndex) => {
                      const actualIndex = slotIndex + DISPLAY_START_INDEX;
                      const value = dayData.slots[actualIndex] || 0;
                      const color = getColorFromValue(value);

                      return (
                        <Tooltip
                          key={slotIndex}
                          title={`${employee.name} - ${
                            DAYS_OF_WEEK[day]
                          }요일 ${formatTimeLabel(timeSlot)} (${getStatusText(
                            value
                          )})`}
                        >
                          <HeatmapCell
                            sx={{
                              flex: 1,
                              bgcolor: color,
                            }}
                            onClick={() =>
                              onCellClick &&
                              onCellClick(employee.id, day, actualIndex)
                            }
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          ))}

          {/* 시간 레이블 (하단) */}
          <Box
            sx={{ display: "flex", mt: 1, borderTop: "1px solid #eee", pt: 1 }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <Box
                key={day}
                sx={{
                  flex: 1,
                  display: "flex",
                  borderRight: day < 6 ? "1px solid #eee" : "none",
                }}
              >
                {[8, 12, 16, 20].map((hour) => {
                  const position = ((hour - 8) / (22 - 8)) * 100;

                  return (
                    <Typography
                      key={hour}
                      variant="caption"
                      sx={{
                        position: "absolute",
                        left: `calc(120px + ${position}%)`,
                        transform: "translateX(-50%)",
                        color: "text.secondary",
                      }}
                    >
                      {`${hour}:00`}
                    </Typography>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default AvailabilityHeatmap;
