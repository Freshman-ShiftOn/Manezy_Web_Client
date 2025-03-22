import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  useTheme,
  alpha,
  Switch,
  FormControlLabel,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ColorLens as ColorLensIcon,
  Settings as SettingsIcon,
  AccessTime as AccessTimeIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Today as TodayIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import { TwitterPicker } from "react-color";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MuiColorInput } from "mui-color-input";
import dayjs from "dayjs";

// 시간대 템플릿 타입 정의
interface ShiftTemplate {
  id: string;
  name: string;
  type: string; // "open" | "middle" | "close" | 커스텀 타입
  startTime: string; // 'HH:MM' 포맷
  endTime: string; // 'HH:MM' 포맷
  requiredStaff: number;
  color: string;
  requiredPositions?: {
    [position: string]: number; // 포지션별 필요 인원수
  };
  dayVariations?: {
    [day: number]: {
      // 0-6 (일-토)
      requiredStaff?: number;
      requiredPositions?: {
        [position: string]: number;
      };
    };
  };
}

interface TemplateManagerDialogProps {
  open: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  onSaveTemplates: (templates: ShiftTemplate[]) => void;
}

// 기본 포지션 목록
const DEFAULT_POSITIONS = ["매니저", "바리스타", "서빙", "주방", "캐셔"];

// 요일 목록
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 새 템플릿의 기본값
const DEFAULT_NEW_TEMPLATE: ShiftTemplate = {
  id: "",
  name: "",
  type: "middle",
  startTime: "12:00",
  endTime: "17:00",
  requiredStaff: 1,
  color: "#2196F3",
  requiredPositions: {
    바리스타: 1,
  },
};

// 시간대별 기본 색상
const TYPE_COLORS = {
  open: "#4CAF50",
  middle: "#2196F3",
  close: "#9C27B0",
  custom: "#FF9800",
};

// 탭 패널 컴포넌트
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
      id={`shift-tabpanel-${index}`}
      aria-labelledby={`shift-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const TemplateManagerDialog: React.FC<TemplateManagerDialogProps> = ({
  open,
  onClose,
  templates,
  onSaveTemplates,
}) => {
  const theme = useTheme();
  const [localTemplates, setLocalTemplates] = useState<ShiftTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(
    null
  );
  const [newTemplate, setNewTemplate] = useState<ShiftTemplate>({
    ...DEFAULT_NEW_TEMPLATE,
  });
  const [tabValue, setTabValue] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [showDayVariations, setShowDayVariations] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 일요일
  const [expandedDays, setExpandedDays] = useState<{ [key: number]: boolean }>(
    {}
  );

  useEffect(() => {
    setLocalTemplates([...templates]);
    setIsAddMode(false);
    setEditingTemplate(null);
  }, [templates, open]);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 템플릿 수정 시작
  const handleEditTemplate = (template: ShiftTemplate) => {
    setEditingTemplate({ ...template });
    setNewTemplate({
      ...template,
      requiredPositions: template.requiredPositions || { 바리스타: 1 },
    });
    setIsAddMode(false);
    setExpandedDays({});
  };

  // 템플릿 삭제
  const handleDeleteTemplate = (templateId: string) => {
    if (
      window.confirm(
        "이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      const updatedTemplates = localTemplates.filter(
        (t) => t.id !== templateId
      );
      setLocalTemplates(updatedTemplates);

      if (editingTemplate?.id === templateId) {
        setEditingTemplate(null);
        setIsAddMode(false);
      }
    }
  };

  // 새 템플릿 추가 모드 시작
  const handleAddNewTemplate = (type: string) => {
    const newId = `template-${Date.now()}`;

    // 시간대별 기본값 설정
    const defaultTimes: Record<
      string,
      { startTime: string; endTime: string; positions?: Record<string, number> }
    > = {
      open: {
        startTime: "09:00",
        endTime: "13:00",
        positions: { 매니저: 1, 바리스타: 1 },
      },
      middle: {
        startTime: "12:00",
        endTime: "17:00",
        positions: { 바리스타: 1, 서빙: 1, 캐셔: 1 },
      },
      close: {
        startTime: "16:00",
        endTime: "22:00",
        positions: { 매니저: 1, 주방: 1 },
      },
      custom: {
        startTime: "10:00",
        endTime: "15:00",
        positions: { 바리스타: 1 },
      },
    };

    const isDefaultType = ["open", "middle", "close"].includes(type);
    const defaultTime = isDefaultType
      ? defaultTimes[type]
      : defaultTimes.custom;

    const defaultName = isDefaultType
      ? type === "open"
        ? "오픈"
        : type === "middle"
        ? "미들"
        : "마감"
      : "커스텀 근무";

    const defaultColor = isDefaultType
      ? TYPE_COLORS[type as keyof typeof TYPE_COLORS]
      : TYPE_COLORS.custom;

    const newTemplateData = {
      ...DEFAULT_NEW_TEMPLATE,
      id: newId,
      type: type,
      name: defaultName,
      startTime: defaultTime.startTime,
      endTime: defaultTime.endTime,
      color: defaultColor,
      requiredPositions: defaultTime.positions || { 바리스타: 1 },
    };

    setNewTemplate(newTemplateData);
    setIsAddMode(true);
    setEditingTemplate(null);
  };

  // 새 커스텀 템플릿 추가
  const handleAddCustomTemplate = () => {
    const customType = prompt("새 근무 유형 이름을 입력하세요:", "");
    if (customType && customType.trim()) {
      handleAddNewTemplate(customType.trim());
    }
  };

  // 템플릿 저장 (추가 또는 수정)
  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    if (isAddMode) {
      // 새 템플릿 추가
      setLocalTemplates([...localTemplates, newTemplate]);
    } else if (editingTemplate) {
      // 기존 템플릿 수정
      const updatedTemplates = localTemplates.map((t) =>
        t.id === editingTemplate.id ? newTemplate : t
      );
      setLocalTemplates(updatedTemplates);
    }

    setEditingTemplate(null);
    setIsAddMode(false);
    setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
  };

  // 입력 필드 변경 핸들러
  const updateEditingTemplate = (field: keyof ShiftTemplate, value: any) => {
    if (!editingTemplate) return;
    setEditingTemplate({ ...editingTemplate, [field]: value });
  };

  // 색상 변경 핸들러
  const handleColorChange = (color: string) => {
    updateEditingTemplate("color", color);
  };

  // 요일별 필요 인원 변경 핸들러
  const handleDayStaffChange = (day: number, value: number) => {
    const updatedDayVariations = {
      ...newTemplate.dayVariations,
      [day]: {
        ...(newTemplate.dayVariations?.[day] || {}),
        requiredStaff: value,
      },
    };

    setNewTemplate({
      ...newTemplate,
      dayVariations: updatedDayVariations,
    });
  };

  // 요일별 포지션 인원 변경 핸들러
  const handleDayPositionChange = (
    day: number,
    position: string,
    value: number
  ) => {
    const dayPositions = {
      ...(newTemplate.dayVariations?.[day]?.requiredPositions || {}),
    };

    if (value <= 0) {
      delete dayPositions[position];
    } else {
      dayPositions[position] = value;
    }

    const updatedDayVariations = {
      ...newTemplate.dayVariations,
      [day]: {
        ...(newTemplate.dayVariations?.[day] || {}),
        requiredPositions: dayPositions,
      },
    };

    setNewTemplate({
      ...newTemplate,
      dayVariations: updatedDayVariations,
    });
  };

  // 모달 닫기 전 확인
  const handleClose = () => {
    if (editingTemplate || isAddMode) {
      if (window.confirm("변경 사항이 있습니다. 정말 닫으시겠습니까?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 변경사항 저장 및 닫기
  const handleSaveAndClose = () => {
    onSaveTemplates(localTemplates);
    onClose();
  };

  // 요일별 필요 인원수 렌더링
  const renderDayVariations = () => {
    const template = newTemplate;
    return (
      <Grid item xs={12} mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          요일별 설정
        </Typography>
        <Box mb={1}>
          <FormControlLabel
            control={
              <Switch
                checked={showDayVariations}
                onChange={() => setShowDayVariations(!showDayVariations)}
              />
            }
            label="요일별로 다른 설정 적용하기"
          />
        </Box>

        {showDayVariations && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box mb={2}>
              <Tabs
                value={selectedDay}
                onChange={(e, newValue) => setSelectedDay(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {DAYS_OF_WEEK.map((day, idx) => (
                  <Tab
                    key={day}
                    label={day}
                    sx={{
                      color:
                        idx === 0
                          ? "error.main"
                          : idx === 6
                          ? "primary.main"
                          : "text.primary",
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {DAYS_OF_WEEK[selectedDay]}요일 설정
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={`${DAYS_OF_WEEK[selectedDay]}요일 필요 인원수`}
                    type="number"
                    size="small"
                    value={
                      newTemplate.dayVariations?.[selectedDay]?.requiredStaff ||
                      newTemplate.requiredStaff
                    }
                    onChange={(e) =>
                      handleDayStaffChange(
                        selectedDay,
                        parseInt(e.target.value) || 1
                      )
                    }
                    InputProps={{
                      inputProps: { min: 1 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {DAYS_OF_WEEK[selectedDay]}요일 필요 포지션
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>포지션</TableCell>
                          <TableCell align="right">필요 인원수</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(
                          newTemplate.requiredPositions || {}
                        ).map(([position]) => (
                          <TableRow key={`${selectedDay}-${position}`}>
                            <TableCell>{position}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={
                                  newTemplate.dayVariations?.[selectedDay]
                                    ?.requiredPositions?.[position] ||
                                  newTemplate.requiredPositions?.[position] ||
                                  0
                                }
                                onChange={(e) =>
                                  handleDayPositionChange(
                                    selectedDay,
                                    position,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                InputProps={{ inputProps: { min: 0 } }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )}
      </Grid>
    );
  };

  // 포지션별 필요 인원수 UI
  const renderPositionRequirements = () => {
    const template = newTemplate;
    return (
      <Grid item xs={12} mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          포지션별 필요 인원
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>포지션</TableCell>
                <TableCell>필요 인원수</TableCell>
                <TableCell align="right">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {template.requiredPositions &&
                Object.entries(template.requiredPositions).map(
                  ([position, count]) => (
                    <TableRow key={position}>
                      <TableCell>{position}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={count}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const updatedPositions = {
                              ...template.requiredPositions,
                            };

                            if (value <= 0) {
                              if (
                                window.confirm(
                                  `${position} 포지션을 제거하시겠습니까?`
                                )
                              ) {
                                delete updatedPositions[position];
                              } else {
                                return;
                              }
                            } else {
                              updatedPositions[position] = value;
                            }

                            updateEditingTemplate(
                              "requiredPositions",
                              updatedPositions
                            );
                          }}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            const updatedPositions = {
                              ...template.requiredPositions,
                            };
                            delete updatedPositions[position];
                            updateEditingTemplate(
                              "requiredPositions",
                              updatedPositions
                            );
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}
              <TableRow>
                <TableCell colSpan={3}>
                  <Box display="flex" mt={1}>
                    <FormControl fullWidth size="small">
                      <InputLabel>새 포지션 추가</InputLabel>
                      <Select
                        value=""
                        label="새 포지션 추가"
                        onChange={(e) => {
                          const position = e.target.value;
                          if (!position) return;

                          if (position === "custom") {
                            const customPosition =
                              window.prompt("추가할 포지션 이름을 입력하세요:");
                            if (customPosition && customPosition.trim()) {
                              const updatedPositions = {
                                ...template.requiredPositions,
                              };

                              if (!updatedPositions[customPosition]) {
                                updatedPositions[customPosition] = 1;
                                updateEditingTemplate(
                                  "requiredPositions",
                                  updatedPositions
                                );
                              } else {
                                alert(
                                  `${customPosition} 포지션은 이미 추가되어 있습니다.`
                                );
                              }
                            }
                            return;
                          }

                          const updatedPositions = {
                            ...template.requiredPositions,
                          };

                          if (!updatedPositions[position]) {
                            updatedPositions[position] = 1;
                            updateEditingTemplate(
                              "requiredPositions",
                              updatedPositions
                            );
                          } else {
                            alert(
                              `${position} 포지션은 이미 추가되어 있습니다.`
                            );
                          }
                        }}
                      >
                        {DEFAULT_POSITIONS.map((pos) => (
                          <MenuItem
                            key={pos}
                            value={pos}
                            disabled={
                              template.requiredPositions &&
                              template.requiredPositions[pos] !== undefined
                            }
                          >
                            {pos}
                          </MenuItem>
                        ))}
                        <MenuItem value="custom">
                          <em>커스텀 포지션 추가...</em>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    );
  };

  // 템플릿 편집 폼
  const renderEditForm = () => {
    if (!editingTemplate) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {newTemplate ? "새 템플릿 추가" : "템플릿 편집"}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="템플릿 이름"
              value={editingTemplate.name}
              onChange={(e) => updateEditingTemplate("name", e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="근무 유형"
              value={editingTemplate.type}
              onChange={(e) => updateEditingTemplate("type", e.target.value)}
              margin="normal"
              disabled={newTemplate !== null} // 새 템플릿인 경우에만 비활성화
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="시작 시간"
                value={new Date(`2022-01-01T${editingTemplate.startTime}`)}
                onChange={(date) => {
                  if (date) {
                    const hours = date.getHours().toString().padStart(2, "0");
                    const minutes = date
                      .getMinutes()
                      .toString()
                      .padStart(2, "0");
                    updateEditingTemplate("startTime", `${hours}:${minutes}`);
                  }
                }}
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="종료 시간"
                value={new Date(`2022-01-01T${editingTemplate.endTime}`)}
                onChange={(date) => {
                  if (date) {
                    const hours = date.getHours().toString().padStart(2, "0");
                    const minutes = date
                      .getMinutes()
                      .toString()
                      .padStart(2, "0");
                    updateEditingTemplate("endTime", `${hours}:${minutes}`);
                  }
                }}
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="기본 필요 인원"
              value={editingTemplate.requiredStaff}
              onChange={(e) =>
                updateEditingTemplate(
                  "requiredStaff",
                  parseInt(e.target.value) || 1
                )
              }
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MuiColorInput
              format="hex"
              value={editingTemplate.color}
              onChange={(color) => updateEditingTemplate("color", color)}
              label="색상"
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>

        {/* 포지션별 필요 인원수 설정 UI */}
        {renderPositionRequirements()}

        {/* 요일별 설정 UI */}
        {renderDayVariations()}

        <Grid item xs={12} mt={2}>
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setEditingTemplate(null);
                setIsAddMode(false);
              }}
              sx={{ mr: 1 }}
            >
              취소
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveTemplate}
            >
              저장
            </Button>
          </Box>
        </Grid>
      </Box>
    );
  };

  // 템플릿 목록 컴포넌트
  const TemplateList = ({ templates }: { templates: ShiftTemplate[] }) => {
    if (templates.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="textSecondary">
            템플릿이 없습니다. 새로운 템플릿을 추가해주세요.
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableCell width="30%">템플릿 이름</TableCell>
              <TableCell width="20%">시간</TableCell>
              <TableCell align="center" width="15%">
                기본 인원
              </TableCell>
              <TableCell align="center" width="20%">
                포지션
              </TableCell>
              <TableCell align="right" width="15%">
                관리
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: template.color,
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {template.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {template.startTime} ~ {template.endTime}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={template.requiredStaff + "명"}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {template.requiredPositions &&
                      Object.entries(template.requiredPositions).map(
                        ([position, count]) => (
                          <Chip
                            key={position}
                            label={`${position} ${count}명`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        )
                      )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditTemplate(template)}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTemplate(template.id)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 특정 탭 렌더링
  const renderTabContent = (tabType: string) => {
    const tabTemplates = localTemplates.filter((t) =>
      tabType === "custom"
        ? !["open", "middle", "close"].includes(t.type)
        : t.type === tabType
    );

    if (isAddMode && newTemplate.type === tabType) {
      return renderEditForm();
    }

    if (
      editingTemplate &&
      (tabType === "custom"
        ? !["open", "middle", "close"].includes(editingTemplate.type)
        : editingTemplate.type === tabType)
    ) {
      return renderEditForm();
    }

    return (
      <>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1">
            {tabType === "open"
              ? "오픈 근무 템플릿 목록"
              : tabType === "middle"
              ? "미들 근무 템플릿 목록"
              : tabType === "close"
              ? "마감 근무 템플릿 목록"
              : "커스텀 근무 템플릿 목록"}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() =>
              tabType === "custom"
                ? handleAddCustomTemplate()
                : handleAddNewTemplate(tabType)
            }
            size="small"
          >
            {tabType === "custom"
              ? "새 커스텀 템플릿"
              : `새 ${
                  tabType === "open"
                    ? "오픈"
                    : tabType === "middle"
                    ? "미들"
                    : "마감"
                } 템플릿`}
          </Button>
        </Box>
        <TemplateList templates={tabTemplates} />
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
        }}
      >
        <Typography variant="h6">근무 템플릿 관리</Typography>
        <Tooltip title="여기서 근무 템플릿을 생성하고 관리할 수 있습니다. 오픈/미들/마감 외에도 커스텀 근무 유형을 만들 수 있으며, 각 템플릿별로 요일마다 다른 포지션 및 필요 인원을 설정할 수 있습니다.">
          <IconButton size="small" sx={{ ml: 1 }}>
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 근무 타입 탭 */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="shift type tabs"
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontWeight: "bold",
                minHeight: "48px",
              },
              "& .Mui-selected": {
                color: (theme) => `${theme.palette.primary.main} !important`,
              },
            }}
          >
            <Tab
              label="오픈 근무"
              sx={{
                color: TYPE_COLORS.open,
                borderBottom:
                  tabValue === 0 ? `3px solid ${TYPE_COLORS.open}` : "none",
              }}
            />
            <Tab
              label="미들 근무"
              sx={{
                color: TYPE_COLORS.middle,
                borderBottom:
                  tabValue === 1 ? `3px solid ${TYPE_COLORS.middle}` : "none",
              }}
            />
            <Tab
              label="마감 근무"
              sx={{
                color: TYPE_COLORS.close,
                borderBottom:
                  tabValue === 2 ? `3px solid ${TYPE_COLORS.close}` : "none",
              }}
            />
            <Tab
              label="커스텀 근무"
              sx={{
                color: TYPE_COLORS.custom,
                borderBottom:
                  tabValue === 3 ? `3px solid ${TYPE_COLORS.custom}` : "none",
              }}
            />
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          {/* 오픈 템플릿 */}
          <TabPanel value={tabValue} index={0}>
            {renderTabContent("open")}
          </TabPanel>

          {/* 미들 템플릿 */}
          <TabPanel value={tabValue} index={1}>
            {renderTabContent("middle")}
          </TabPanel>

          {/* 마감 템플릿 */}
          <TabPanel value={tabValue} index={2}>
            {renderTabContent("close")}
          </TabPanel>

          {/* 커스텀 템플릿 */}
          <TabPanel value={tabValue} index={3}>
            {renderTabContent("custom")}
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          justifyContent: "space-between",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button onClick={handleClose} color="inherit">
          취소
        </Button>
        <Button
          onClick={handleSaveAndClose}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          모든 변경사항 저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateManagerDialog;
