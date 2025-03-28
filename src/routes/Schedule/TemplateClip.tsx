import React from "react";
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

// 요일 배열
const DAYS_OF_WEEK = [
  { id: 0, name: "일", shortName: "일", color: "#f44336" },
  { id: 1, name: "월", shortName: "월", color: "#9e9e9e" },
  { id: 2, name: "화", shortName: "화", color: "#9e9e9e" },
  { id: 3, name: "수", shortName: "수", color: "#9e9e9e" },
  { id: 4, name: "목", shortName: "목", color: "#9e9e9e" },
  { id: 5, name: "금", shortName: "금", color: "#9e9e9e" },
  { id: 6, name: "토", shortName: "토", color: "#2196f3" },
];

interface TemplateClipProps {
  template: {
    id: string;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    requiredStaff: number;
    color: string;
    requiredPositions?: Record<string, number>;
    applicableDays?: number[];
  };
  onEdit?: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
}

const TemplateClip: React.FC<TemplateClipProps> = ({
  template,
  onEdit,
  onDelete,
}) => {
  // 적용 요일 표시
  const renderApplicableDays = () => {
    if (!template.applicableDays || template.applicableDays.length === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          모든 요일
        </Typography>
      );
    }

    if (template.applicableDays.length === 7) {
      return (
        <Typography variant="caption" color="text.secondary">
          모든 요일
        </Typography>
      );
    }

    // 평일만 선택됐는지 확인 (월~금)
    const isWeekdaysOnly =
      template.applicableDays.length === 5 &&
      [1, 2, 3, 4, 5].every((day) => template.applicableDays?.includes(day));

    if (isWeekdaysOnly) {
      return (
        <Chip size="small" label="평일" color="primary" variant="outlined" />
      );
    }

    // 주말만 선택됐는지 확인 (토, 일)
    const isWeekendsOnly =
      template.applicableDays.length === 2 &&
      [0, 6].every((day) => template.applicableDays?.includes(day));

    if (isWeekendsOnly) {
      return (
        <Chip size="small" label="주말" color="error" variant="outlined" />
      );
    }

    // 요일 동그라미로 표시
    return (
      <Box display="flex" gap={0.5}>
        {DAYS_OF_WEEK.map((day) => (
          <Tooltip key={day.id} title={day.name}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: template.applicableDays?.includes(day.id)
                  ? day.id === 0 || day.id === 6
                    ? day.color
                    : template.color
                  : "transparent",
                color: template.applicableDays?.includes(day.id)
                  ? "white"
                  : "text.disabled",
                border: `1px solid ${
                  template.applicableDays?.includes(day.id)
                    ? day.id === 0 || day.id === 6
                      ? day.color
                      : template.color
                    : "divider"
                }`,
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              {day.shortName}
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderLeft: `4px solid ${template.color}`,
      }}
    >
      <CardContent sx={{ p: "12px", "&:last-child": { pb: "12px" } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {template.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {template.startTime} ~ {template.endTime}
            </Typography>
          </Box>
          <Box>
            {onEdit && (
              <IconButton size="small" onClick={() => onEdit(template.id)}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(template.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              기본 인원: <strong>{template.requiredStaff}명</strong>
            </Typography>

            {template.requiredPositions &&
              Object.keys(template.requiredPositions).length > 0 && (
                <Box mt={0.5} display="flex" flexWrap="wrap" gap={0.5}>
                  {Object.entries(template.requiredPositions).map(
                    ([position, count]) => (
                      <Chip
                        key={position}
                        label={`${position} ${count}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: "20px", fontSize: "0.7rem" }}
                      />
                    )
                  )}
                </Box>
              )}
          </Box>

          <Box>{renderApplicableDays()}</Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TemplateClip;
