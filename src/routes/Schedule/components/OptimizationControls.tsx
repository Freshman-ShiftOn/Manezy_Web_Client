import React from "react";
import {
  Paper,
  Typography,
  Box,
  Slider,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

export interface OptimizationSettings {
  equalDistribution: number;
  preferenceWeight: number;
  minimumStaffing: number;
  minimizeCost: number;
  considerEmployeeRequests: boolean;
  respectWorkingHourLimits: boolean;
  maxShiftsPerDay: number;
  minHoursBetweenShifts: number;
}

interface OptimizationControlsProps {
  settings: OptimizationSettings;
  onSettingsChange: (settings: OptimizationSettings) => void;
  onRunOptimization: () => void;
  onCompareResults: () => void;
  onReset: () => void;
  isLoading?: boolean;
  hasResults?: boolean;
}

const OptimizationControls: React.FC<OptimizationControlsProps> = ({
  settings,
  onSettingsChange,
  onRunOptimization,
  onCompareResults,
  onReset,
  isLoading = false,
  hasResults = false,
}) => {
  const handleSliderChange =
    (name: keyof OptimizationSettings) =>
    (event: Event, newValue: number | number[]) => {
      onSettingsChange({
        ...settings,
        [name]: newValue as number,
      });
    };

  const handleSwitchChange =
    (name: keyof OptimizationSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSettingsChange({
        ...settings,
        [name]: event.target.checked,
      });
    };

  const handleNumberInputChange =
    (name: keyof OptimizationSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      if (!isNaN(value)) {
        onSettingsChange({
          ...settings,
          [name]: value,
        });
      }
    };

  return (
    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
      <Typography variant="subtitle1" gutterBottom>
        최적화 설정
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            균등한 근무 시간 배분
          </Typography>
          <Tooltip title="모든 직원에게 가능한 균등하게 근무 시간을 배분합니다">
            <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        <Slider
          value={settings.equalDistribution}
          onChange={handleSliderChange("equalDistribution")}
          aria-labelledby="equal-distribution-slider"
          valueLabelDisplay="auto"
          step={1}
          marks
          min={0}
          max={10}
          disabled={isLoading}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            직원 선호도 반영 정도
          </Typography>
          <Tooltip title="직원이 선호하는 시간대에 근무를 배정하는 중요도입니다">
            <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        <Slider
          value={settings.preferenceWeight}
          onChange={handleSliderChange("preferenceWeight")}
          aria-labelledby="preference-weight-slider"
          valueLabelDisplay="auto"
          step={1}
          marks
          min={0}
          max={10}
          disabled={isLoading}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            최소 인력 배치 중요도
          </Typography>
          <Tooltip title="각 시간대별 필요한 최소 인력을 배치하는 중요도입니다">
            <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        <Slider
          value={settings.minimumStaffing}
          onChange={handleSliderChange("minimumStaffing")}
          aria-labelledby="minimum-staffing-slider"
          valueLabelDisplay="auto"
          step={1}
          marks
          min={0}
          max={10}
          disabled={isLoading}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            비용 최소화 중요도
          </Typography>
          <Tooltip title="전체 근무 비용을 최소화하는 중요도입니다">
            <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        <Slider
          value={settings.minimizeCost}
          onChange={handleSliderChange("minimizeCost")}
          aria-labelledby="minimize-cost-slider"
          valueLabelDisplay="auto"
          step={1}
          marks
          min={0}
          max={10}
          disabled={isLoading}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.considerEmployeeRequests}
              onChange={handleSwitchChange("considerEmployeeRequests")}
              name="considerEmployeeRequests"
              color="primary"
              disabled={isLoading}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2">직원 휴가/요청 반영</Typography>
              <Tooltip title="직원의 휴가 요청이나 특별 요청을 반영합니다">
                <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.respectWorkingHourLimits}
              onChange={handleSwitchChange("respectWorkingHourLimits")}
              name="respectWorkingHourLimits"
              color="primary"
              disabled={isLoading}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2">주간 근무시간 제한 준수</Typography>
              <Tooltip title="직원별 주당 최대 근무시간을 준수합니다">
                <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="최대 연속 근무 수"
          type="number"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            inputProps: { min: 1, max: 3 },
            endAdornment: <InputAdornment position="end">회/일</InputAdornment>,
          }}
          value={settings.maxShiftsPerDay}
          onChange={handleNumberInputChange("maxShiftsPerDay")}
          disabled={isLoading}
          size="small"
          sx={{ width: "50%" }}
        />
        <TextField
          label="최소 근무간 휴식"
          type="number"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            inputProps: { min: 0, max: 24 },
            endAdornment: <InputAdornment position="end">시간</InputAdornment>,
          }}
          value={settings.minHoursBetweenShifts}
          onChange={handleNumberInputChange("minHoursBetweenShifts")}
          disabled={isLoading}
          size="small"
          sx={{ width: "50%" }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onReset}
          startIcon={<RestartAltIcon />}
          size="medium"
          disabled={isLoading}
        >
          초기화
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          {hasResults && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={onCompareResults}
              startIcon={<CompareArrowsIcon />}
              size="medium"
              disabled={isLoading}
            >
              결과 비교
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={onRunOptimization}
            startIcon={<PlayArrowIcon />}
            size="medium"
            disabled={isLoading}
          >
            최적화 실행
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default OptimizationControls;
