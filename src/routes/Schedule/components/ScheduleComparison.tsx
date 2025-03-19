import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Divider,
  Grid,
  Tooltip,
  Badge,
  IconButton,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import FilterNoneIcon from "@mui/icons-material/FilterNone";

export interface ScheduleChange {
  id: string;
  employeeId: string;
  employeeName: string;
  original: {
    start: Date | null;
    end: Date | null;
    position: string;
  };
  optimized: {
    start: Date | null;
    end: Date | null;
    position: string;
  };
  changeType: "added" | "removed" | "modified";
  impact: "positive" | "negative" | "neutral";
  conflictReason?: string;
}

interface ScheduleComparisonProps {
  changes: ScheduleChange[];
  onApply: (selectedChanges: string[]) => void;
  onApplyAll: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ScheduleComparison: React.FC<ScheduleComparisonProps> = ({
  changes,
  onApply,
  onApplyAll,
  onCancel,
  isLoading = false,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleToggleChange = (changeId: string) => {
    setSelectedChanges((prev) =>
      prev.includes(changeId)
        ? prev.filter((id) => id !== changeId)
        : [...prev, changeId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredChanges();
    setSelectedChanges(filtered.map((change) => change.id));
  };

  const handleSelectNone = () => {
    setSelectedChanges([]);
  };

  const getFilteredChanges = () => {
    if (selectedTab === 0) return changes;
    if (selectedTab === 1)
      return changes.filter((c) => c.changeType === "added");
    if (selectedTab === 2)
      return changes.filter((c) => c.changeType === "removed");
    if (selectedTab === 3)
      return changes.filter((c) => c.changeType === "modified");
    if (selectedTab === 4)
      return changes.filter((c) => c.impact === "positive");
    if (selectedTab === 5)
      return changes.filter((c) => c.impact === "negative");
    return changes;
  };

  // 날짜 포맷 유틸리티 함수
  const formatDate = (date: Date | null) => {
    if (!date) return "없음";
    return `${date.getMonth() + 1}/${date.getDate()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  // 요약 통계
  const stats = {
    added: changes.filter((c) => c.changeType === "added").length,
    removed: changes.filter((c) => c.changeType === "removed").length,
    modified: changes.filter((c) => c.changeType === "modified").length,
    positive: changes.filter((c) => c.impact === "positive").length,
    negative: changes.filter((c) => c.impact === "negative").length,
    neutral: changes.filter((c) => c.impact === "neutral").length,
  };

  return (
    <Paper sx={{ p: 0, mb: 2, overflow: "hidden" }} elevation={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h6">
          스케줄 변경 비교 ({changes.length}건)
        </Typography>
        <IconButton
          size="small"
          onClick={onCancel}
          sx={{ color: "primary.contrastText" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Chip
            icon={<InfoIcon />}
            label={`추가: ${stats.added}건`}
            size="small"
            color="default"
            variant="outlined"
          />
          <Chip
            icon={<InfoIcon />}
            label={`제거: ${stats.removed}건`}
            size="small"
            color="default"
            variant="outlined"
          />
          <Chip
            icon={<InfoIcon />}
            label={`변경: ${stats.modified}건`}
            size="small"
            color="default"
            variant="outlined"
          />
          <Chip
            icon={<ThumbUpIcon />}
            label={`긍정적: ${stats.positive}건`}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<ThumbDownIcon />}
            label={`부정적: ${stats.negative}건`}
            size="small"
            color="error"
            variant="outlined"
          />
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="전체" />
          <Tab
            label={
              <Badge badgeContent={stats.added} color="primary">
                추가됨
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.removed} color="primary">
                제거됨
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.modified} color="primary">
                변경됨
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.positive} color="success">
                긍정적
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.negative} color="error">
                부정적
              </Badge>
            }
          />
        </Tabs>
      </Box>

      <Divider />

      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#f5f5f5",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            {selectedChanges.length}개 선택됨
          </Typography>
          <Button
            size="small"
            onClick={handleSelectAll}
            startIcon={<DoneAllIcon />}
          >
            모두 선택
          </Button>
          <Button
            size="small"
            onClick={handleSelectNone}
            startIcon={<FilterNoneIcon />}
          >
            모두 해제
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small" onClick={onCancel}>
            취소
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => onApply(selectedChanges)}
            disabled={selectedChanges.length === 0 || isLoading}
          >
            선택 적용
          </Button>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={onApplyAll}
            disabled={isLoading}
          >
            모두 적용
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          maxHeight: 400,
          overflow: "auto",
          px: 2,
          py: 1,
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#bdbdbd",
            borderRadius: "4px",
          },
        }}
      >
        {getFilteredChanges().length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="textSecondary">
              해당하는 변경사항이 없습니다.
            </Typography>
          </Box>
        ) : (
          getFilteredChanges().map((change) => (
            <Paper
              key={change.id}
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 1.5,
                borderLeft: "4px solid",
                borderLeftColor:
                  change.changeType === "added"
                    ? "success.main"
                    : change.changeType === "removed"
                    ? "error.main"
                    : "info.main",
                bgcolor: selectedChanges.includes(change.id)
                  ? alpha("#bbdefb", 0.3)
                  : "transparent",
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: alpha("#bbdefb", 0.15),
                },
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {change.employeeName}
                    </Typography>
                    {change.impact === "positive" && (
                      <Tooltip title="선호도가 높은 변경">
                        <ThumbUpIcon
                          color="success"
                          fontSize="small"
                          sx={{ ml: 1 }}
                        />
                      </Tooltip>
                    )}
                    {change.impact === "negative" && (
                      <Tooltip title="선호도가 낮은 변경">
                        <ThumbDownIcon
                          color="error"
                          fontSize="small"
                          sx={{ ml: 1 }}
                        />
                      </Tooltip>
                    )}
                    {change.conflictReason && (
                      <Tooltip title={change.conflictReason}>
                        <WarningIcon
                          color="warning"
                          fontSize="small"
                          sx={{ ml: 1 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Chip
                    size="small"
                    label={
                      change.changeType === "added"
                        ? "추가"
                        : change.changeType === "removed"
                        ? "제거"
                        : "변경"
                    }
                    color={
                      change.changeType === "added"
                        ? "success"
                        : change.changeType === "removed"
                        ? "error"
                        : "info"
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    원래 스케줄:
                  </Typography>
                  <Box sx={{ ml: 1 }}>
                    {change.original.start ? (
                      <>
                        <Typography variant="body2">
                          {formatDate(change.original.start)} -{" "}
                          {formatDate(change.original.end)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {change.original.position}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        (없음)
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    최적화 스케줄:
                  </Typography>
                  <Box sx={{ ml: 1 }}>
                    {change.optimized.start ? (
                      <>
                        <Typography variant="body2">
                          {formatDate(change.optimized.start)} -{" "}
                          {formatDate(change.optimized.end)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {change.optimized.position}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        (없음)
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={1}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      height: "100%",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      onClick={() => handleToggleChange(change.id)}
                      color={
                        selectedChanges.includes(change.id)
                          ? "primary"
                          : "default"
                      }
                      size="small"
                    >
                      {selectedChanges.includes(change.id) ? (
                        <CheckIcon />
                      ) : (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            border: "1px solid #ccc",
                            borderRadius: "2px",
                          }}
                        />
                      )}
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default ScheduleComparison;
