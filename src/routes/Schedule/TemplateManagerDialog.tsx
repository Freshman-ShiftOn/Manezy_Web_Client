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
  Card,
  CardContent,
  Checkbox,
  FormGroup,
  FormLabel,
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
  Warning as WarningIcon,
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
  applicableDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] - 일요일부터 토요일
}

// 시간대별 기본 색상
const TYPE_COLORS = {
  open: "#4CAF50",
  middle: "#2196F3",
  close: "#9C27B0",
  custom: "#FF9800",
};

interface TemplateManagerDialogProps {
  open: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  onSaveTemplates: (templates: ShiftTemplate[]) => void;
}

// 기본 포지션 목록
const DEFAULT_POSITIONS = ["매니저", "바리스타", "서빙", "주방", "캐셔"];

// 요일 목록
const DAYS_OF_WEEK = [
  { id: 0, name: "일요일" },
  { id: 1, name: "월요일" },
  { id: 2, name: "화요일" },
  { id: 3, name: "수요일" },
  { id: 4, name: "목요일" },
  { id: 5, name: "금요일" },
  { id: 6, name: "토요일" },
];

// 기본 근무 파트 목록
const DEFAULT_SHIFT_TYPES = [
  { id: "open", name: "오픈", color: TYPE_COLORS.open, isDefault: true },
  { id: "middle", name: "미들", color: TYPE_COLORS.middle, isDefault: true },
  { id: "close", name: "마감", color: TYPE_COLORS.close, isDefault: true },
];

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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedDays, setExpandedDays] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [showPartManager, setShowPartManager] = useState(false);
  const [shiftTypes, setShiftTypes] =
    useState<
      Array<{ id: string; name: string; color: string; isDefault?: boolean }>
    >(DEFAULT_SHIFT_TYPES);
  const [editingShiftType, setEditingShiftType] = useState<{
    id: string;
    name: string;
    color: string;
    isDefault?: boolean;
  } | null>(null);

  // 요일 선택 상태 추가
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // 기본값: 월~금

  // 편집 중인 제약 조건 상태
  const [positionConstraints, setPositionConstraints] = useState<
    Record<string, number>
  >({});
  const [newPositionName, setNewPositionName] = useState<string>("");
  const [newPositionCount, setNewPositionCount] = useState<number>(1);

  useEffect(() => {
    setLocalTemplates([...templates]);
    setIsAddMode(false);
    setEditingTemplate(null);

    // 로컬 스토리지에서 근무 파트 목록 불러오기
    const savedShiftTypes = localStorage.getItem("manezy_shift_types");
    if (savedShiftTypes) {
      try {
        const parsedTypes = JSON.parse(savedShiftTypes);
        // 기존 기본 타입이 있는지 확인하고 없으면 추가 (오픈/미들/마감은 항상 존재해야 함)
        const mergedTypes = [...parsedTypes];

        DEFAULT_SHIFT_TYPES.forEach((defaultType) => {
          if (!mergedTypes.some((t) => t.id === defaultType.id)) {
            mergedTypes.push(defaultType);
          }
        });

        setShiftTypes(mergedTypes);
      } catch (error) {
        console.error("근무 파트 불러오기 오류:", error);
        setShiftTypes(DEFAULT_SHIFT_TYPES);
      }
    }
  }, [templates, open]);

  // shiftTypes가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem("manezy_shift_types", JSON.stringify(shiftTypes));
    } catch (error) {
      console.error("근무 파트 저장 오류:", error);
    }
  }, [shiftTypes]);

  // shiftTypes가 변경될 때 탭 값 검사
  useEffect(() => {
    // 현재 선택된 탭이 유효한지 확인
    if (tabValue >= shiftTypes.length) {
      // 유효하지 않다면 첫 번째 탭으로 리셋
      setTabValue(0);
    }
  }, [shiftTypes, tabValue]);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 템플릿 편집 핸들러
  const handleEditTemplate = (template: ShiftTemplate) => {
    setEditingTemplate({ ...template });
    setNewTemplate({
      ...template,
      requiredPositions: template.requiredPositions || { 바리스타: 1 },
    });
    setIsAddMode(false);
    setExpandedDays({});
    // 템플릿의 적용 요일 설정
    setSelectedDays(template.applicableDays || [1, 2, 3, 4, 5]);
    setPositionConstraints(template.requiredPositions || {});
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

  // 새 템플릿 추가
  const handleAddNewTemplate = (type: string) => {
    // ID 생성
    const templateId = `${type}-${Date.now()}`;

    // 타입에 맞는 기본 색상 가져오기
    const shiftType = shiftTypes.find((t) => t.id === type);
    const color = shiftType ? shiftType.color : "#2196F3";

    // 초기 템플릿 설정
    const template: ShiftTemplate = {
      id: templateId,
      name: `${shiftType ? shiftType.name : type} 템플릿`,
      type: type,
      startTime: "09:00",
      endTime: "18:00",
      requiredStaff: 2,
      color: color,
      requiredPositions: {
        바리스타: 1,
        서빙: 1,
      },
      applicableDays: [1, 2, 3, 4, 5], // 기본값: 월~금
    };

    setNewTemplate(template);
    setEditingTemplate(template);
    setIsAddMode(true);
    setSelectedDays([1, 2, 3, 4, 5]); // 기본값: 월~금
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
    if (!editingTemplate || !editingTemplate.name.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    // 저장할 템플릿에 applicableDays 필드 설정
    const templateToSave = {
      ...editingTemplate,
      applicableDays:
        selectedDays.length > 0 ? [...selectedDays] : [0, 1, 2, 3, 4, 5, 6],
    };

    if (isAddMode) {
      // 새 템플릿 추가
      setLocalTemplates([...localTemplates, templateToSave]);
    } else {
      // 기존 템플릿 수정
      const updatedTemplates = localTemplates.map((t) =>
        t.id === templateToSave.id ? templateToSave : t
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

  // 특정 요일의 스태프 수 변경
  const handleDayStaffChange = (dayId: number, count: number) => {
    if (!newTemplate || !newTemplate.dayVariations) return;

    setNewTemplate((prev) => {
      const updated = { ...prev };
      if (!updated.dayVariations) {
        updated.dayVariations = {};
      }
      if (!updated.dayVariations[dayId]) {
        updated.dayVariations[dayId] = {};
      }
      updated.dayVariations[dayId].requiredStaff = count;
      return updated;
    });
  };

  // 특정 요일의 특정 포지션 인원 수 변경
  const handleDayPositionChange = (
    dayId: number,
    position: string,
    count: number
  ) => {
    if (!newTemplate || !newTemplate.dayVariations) return;

    setNewTemplate((prev) => {
      const updated = { ...prev };
      if (!updated.dayVariations) {
        updated.dayVariations = {};
      }
      if (!updated.dayVariations[dayId]) {
        updated.dayVariations[dayId] = {};
      }
      if (!updated.dayVariations[dayId].requiredPositions) {
        updated.dayVariations[dayId].requiredPositions = {};
      }
      updated.dayVariations[dayId].requiredPositions[position] = count;
      return updated;
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

  // 새 근무 파트 추가
  const handleAddNewShiftType = () => {
    const newId = prompt("새 근무 파트의 ID를 입력하세요 (영문/숫자만 가능):");
    if (!newId || !newId.trim()) return;

    // 영문/숫자만 허용하는 검증
    if (!/^[a-zA-Z0-9]+$/.test(newId)) {
      alert("ID는 영문자와 숫자만 사용 가능합니다.");
      return;
    }

    // ID 중복 검사
    if (shiftTypes.some((type) => type.id === newId)) {
      alert(`'${newId}' ID는 이미 사용 중입니다. 다른 ID를 입력해주세요.`);
      return;
    }

    const newType = {
      id: newId,
      name: newId,
      color: TYPE_COLORS.custom,
    };

    setShiftTypes([...shiftTypes, newType]);
    setEditingShiftType(newType);
  };

  // 근무 파트 삭제
  const handleDeleteShiftType = (id: string) => {
    // 기본 파트는 삭제 불가
    const typeToDelete = shiftTypes.find((type) => type.id === id);
    if (typeToDelete?.isDefault) {
      alert("기본 파트(오픈, 미들, 마감)는 삭제할 수 없습니다.");
      return;
    }

    // 해당 파트를 사용하는 템플릿이 있는지 확인
    const templatesUsingType = localTemplates.filter(
      (template) => template.type === id
    );
    if (templatesUsingType.length > 0) {
      if (
        !window.confirm(
          `이 파트를 사용하고 있는 템플릿이 ${templatesUsingType.length}개 있습니다. 삭제하면 해당 템플릿들도 모두 삭제됩니다. 계속하시겠습니까?`
        )
      ) {
        return;
      }

      // 해당 파트를 사용하는 템플릿 모두 삭제
      const updatedTemplates = localTemplates.filter(
        (template) => template.type !== id
      );
      setLocalTemplates(updatedTemplates);
    }

    // 파트 삭제
    setShiftTypes(shiftTypes.filter((type) => type.id !== id));

    // 편집 중이었다면 편집 모드 종료
    if (editingShiftType?.id === id) {
      setEditingShiftType(null);
    }
  };

  // 근무 파트 저장
  const handleSaveShiftType = () => {
    if (!editingShiftType) return;

    // 이름 검증
    if (!editingShiftType.name.trim()) {
      alert("파트 이름을 입력해주세요.");
      return;
    }

    // 파트 정보 업데이트
    const updatedTypes = shiftTypes.map((type) =>
      type.id === editingShiftType.id ? editingShiftType : type
    );

    setShiftTypes(updatedTypes);

    // 해당 파트 ID를 사용하는 템플릿의 표시 이름도 변경할지 물어보기
    const templatesUsingThisType = localTemplates.filter(
      (template) =>
        template.type === editingShiftType.id &&
        template.name.includes(editingShiftType.id)
    );

    if (
      templatesUsingThisType.length > 0 &&
      window.confirm(`이 파트를 사용하는 템플릿의 이름도 업데이트하시겠습니까?`)
    ) {
      const updatedTemplates = localTemplates.map((template) => {
        if (template.type === editingShiftType.id) {
          // 템플릿 이름이 기존 파트 이름을 포함하고 있다면 새 파트 이름으로 대체
          return {
            ...template,
            name: template.name.replace(
              new RegExp(`\\b${editingShiftType.id}\\b`, "gi"),
              editingShiftType.name
            ),
          };
        }
        return template;
      });

      setLocalTemplates(updatedTemplates);
    }

    setEditingShiftType(null);
  };

  // 적용 요일 선택 UI
  const renderDayVariations = () => {
    return (
      <Grid item xs={12} mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          적용 요일 선택
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              if (selectedDays.length === 7) {
                setSelectedDays([]);
              } else {
                setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
              }
            }}
            sx={{ mr: 1, mb: 1 }}
          >
            {selectedDays.length === 7 ? "전체 해제" : "전체 선택"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
            sx={{ mr: 1, mb: 1 }}
            color="primary"
          >
            평일만 (월-금)
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedDays([0, 6])}
            sx={{ mb: 1 }}
            color="error"
          >
            주말만 (토, 일)
          </Button>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {DAYS_OF_WEEK.map((day) => (
            <Chip
              key={day.id}
              label={day.name}
              color={selectedDays.includes(day.id) ? "primary" : "default"}
              variant={selectedDays.includes(day.id) ? "filled" : "outlined"}
              onClick={() => {
                if (selectedDays.includes(day.id)) {
                  setSelectedDays(selectedDays.filter((id) => id !== day.id));
                } else {
                  setSelectedDays([...selectedDays, day.id]);
                }
              }}
              sx={{
                minWidth: "90px",
                justifyContent: "center",
                color:
                  day.id === 0 || day.id === 6
                    ? selectedDays.includes(day.id)
                      ? "white"
                      : "error.main"
                    : undefined,
                bgcolor:
                  (day.id === 0 || day.id === 6) &&
                  selectedDays.includes(day.id)
                    ? "error.main"
                    : undefined,
              }}
            />
          ))}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          선택한 요일에만 이 템플릿이 적용됩니다. 다른 요일에는 다른 템플릿을
          적용할 수 있습니다.
        </Typography>
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

  // 요일별 세부설정 포함
  const renderDayVariationsDetails = () => {
    return (
      <Grid item xs={12} mt={2}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              요일별 세부 설정 (선택사항)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              선택한 요일마다 필요 인원수와 포지션을 다르게 설정할 수 있습니다.
            </Typography>

            <Tabs
              value={selectedDay}
              onChange={(_, newValue) => setSelectedDay(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {DAYS_OF_WEEK.filter((day) => selectedDays.includes(day.id)).map(
                (day) => (
                  <Tab
                    key={day.id}
                    label={day.name}
                    sx={{
                      color:
                        day.id === 0 || day.id === 6
                          ? "error.main"
                          : "text.primary",
                    }}
                  />
                )
              )}
            </Tabs>

            {selectedDay !== null && selectedDays.includes(selectedDay) && (
              <Paper sx={{ p: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.name} 설정
                  </Typography>

                  <Grid container spacing={2} mt={1}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={`${
                          DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.name
                        } 필요 인원수`}
                        type="number"
                        size="small"
                        value={
                          newTemplate.dayVariations?.[selectedDay]
                            ?.requiredStaff || newTemplate.requiredStaff
                        }
                        onChange={(e) =>
                          handleDayStaffChange(
                            selectedDay,
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.name}{" "}
                        필요 포지션
                      </Typography>

                      <TableContainer component={Paper} variant="outlined">
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
                                      newTemplate.requiredPositions?.[
                                        position
                                      ] ||
                                      0
                                    }
                                    onChange={(e) =>
                                      handleDayPositionChange(
                                        selectedDay,
                                        position,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    sx={{ width: "80px" }}
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
          </AccordionDetails>
        </Accordion>
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

        {/* 적용 요일 선택 UI 추가 */}
        {renderDayVariations()}

        {/* 포지션별 필요 인원수 설정 UI */}
        {renderPositionRequirements()}

        {/* 요일별 세부설정 포함 */}
        {renderDayVariationsDetails()}

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
              <TableCell width="25%">템플릿 이름</TableCell>
              <TableCell width="20%">시간</TableCell>
              <TableCell align="center" width="15%">
                기본 인원
              </TableCell>
              <TableCell align="center" width="20%">
                적용 요일
              </TableCell>
              <TableCell align="right" width="20%">
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
                    {template.applicableDays &&
                    template.applicableDays.length > 0 ? (
                      template.applicableDays.length === 7 ? (
                        <Chip size="small" label="모든 요일" />
                      ) : template.applicableDays.length === 5 &&
                        [1, 2, 3, 4, 5].every((day) =>
                          template.applicableDays?.includes(day)
                        ) ? (
                        <Chip
                          size="small"
                          label="평일"
                          color="primary"
                          variant="outlined"
                        />
                      ) : template.applicableDays.length === 2 &&
                        [0, 6].every((day) =>
                          template.applicableDays?.includes(day)
                        ) ? (
                        <Chip
                          size="small"
                          label="주말"
                          color="error"
                          variant="outlined"
                        />
                      ) : (
                        <Tooltip
                          title={template.applicableDays
                            .map((day) => {
                              const dayInfo = DAYS_OF_WEEK.find(
                                (d) => d.id === day
                              );
                              return dayInfo ? dayInfo.name : "";
                            })
                            .filter((name) => name)
                            .join(", ")}
                        >
                          <Chip
                            size="small"
                            label={`${template.applicableDays.length}일 선택됨`}
                            variant="outlined"
                          />
                        </Tooltip>
                      )
                    ) : (
                      <Chip size="small" label="모든 요일" variant="outlined" />
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
    const tabTemplates = localTemplates.filter((t) => t.type === tabType);
    const currentType = shiftTypes.find((t) => t.id === tabType);

    if (!currentType) return null;

    if (isAddMode && newTemplate.type === tabType) {
      return renderEditForm();
    }

    if (editingTemplate && editingTemplate.type === tabType) {
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
            {currentType.name} 근무 템플릿 목록
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleAddNewTemplate(tabType)}
            size="small"
          >
            새 {currentType.name} 템플릿
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="근무 파트 유형을 관리합니다. 새로운 파트를 추가하거나 기존 파트를 수정, 삭제할 수 있습니다.">
            <Button
              size="small"
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowPartManager(true)}
              sx={{ mr: 1 }}
            >
              파트 관리
            </Button>
          </Tooltip>
          <Tooltip title="여기서 근무 템플릿을 생성하고 관리할 수 있습니다. 오픈/미들/마감 외에도 커스텀 근무 유형을 만들 수 있으며, 각 템플릿별로 요일마다 다른 포지션 및 필요 인원을 설정할 수 있습니다.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
            variant="scrollable"
            scrollButtons="auto"
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
            {shiftTypes.map((type, index) => (
              <Tab
                key={type.id}
                label={type.name}
                sx={{
                  color: type.color,
                  borderBottom:
                    tabValue === index ? `3px solid ${type.color}` : "none",
                }}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          {/* 동적으로 탭 패널 생성 */}
          {shiftTypes.map((type, index) => (
            <TabPanel key={type.id} value={tabValue} index={index}>
              {renderTabContent(type.id)}
            </TabPanel>
          ))}
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

      {/* 근무 파트 관리 다이얼로그 */}
      <Dialog
        open={showPartManager}
        onClose={() => setShowPartManager(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>근무 파트 관리</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            근무 파트를 추가, 수정, 삭제할 수 있습니다. 기본 파트(오픈, 미들,
            마감)는 삭제할 수 없지만 이름을 변경할 수 있습니다.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>파트 ID</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>색상</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shiftTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.id}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: type.color,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => setEditingShiftType({ ...type })}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {!type.isDefault && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteShiftType(type.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNewShiftType}
            fullWidth
          >
            새 근무 파트 추가
          </Button>

          {editingShiftType && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                {editingShiftType.isDefault
                  ? "기본 파트 수정"
                  : "근무 파트 수정"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="파트 이름"
                    value={editingShiftType.name}
                    onChange={(e) =>
                      setEditingShiftType({
                        ...editingShiftType,
                        name: e.target.value,
                      })
                    }
                    size="small"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <MuiColorInput
                    format="hex"
                    value={editingShiftType.color}
                    onChange={(color) =>
                      setEditingShiftType({
                        ...editingShiftType,
                        color,
                      })
                    }
                    label="색상"
                    fullWidth
                    size="small"
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  color="inherit"
                  onClick={() => setEditingShiftType(null)}
                  sx={{ mr: 1 }}
                >
                  취소
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveShiftType}
                >
                  저장
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPartManager(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default TemplateManagerDialog;
