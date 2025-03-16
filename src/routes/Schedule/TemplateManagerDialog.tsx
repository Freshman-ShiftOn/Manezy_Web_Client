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
} from "@mui/icons-material";
import * as ReactColor from "react-color";

// 시간대 템플릿 타입 정의 (SchedulePage.tsx의 정의와 동일)
interface ShiftTemplate {
  id: string;
  name: string;
  type: "open" | "middle" | "close";
  startTime: string; // 'HH:MM' 포맷
  endTime: string; // 'HH:MM' 포맷
  requiredStaff: number;
  color: string;
}

interface TemplateManagerDialogProps {
  open: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  onSaveTemplates: (templates: ShiftTemplate[]) => void;
}

// 새 템플릿의 기본값
const DEFAULT_NEW_TEMPLATE: ShiftTemplate = {
  id: "",
  name: "",
  type: "middle",
  startTime: "12:00",
  endTime: "17:00",
  requiredStaff: 1,
  color: "#2196F3",
};

// 시간대별 기본 색상
const TYPE_COLORS = {
  open: "#4CAF50",
  middle: "#2196F3",
  close: "#9C27B0",
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
      style={{ paddingTop: 16 }}
    >
      {value === index && <Box>{children}</Box>}
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
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [operatingHours, setOperatingHours] = useState({
    open: "09:00",
    close: "22:00",
  });

  useEffect(() => {
    // 템플릿 초기화
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
    setNewTemplate({ ...template });
    setIsAddMode(false);
  };

  // 템플릿 삭제
  const handleDeleteTemplate = (templateId: string) => {
    // 삭제 전 확인 메시지 추가
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
  const handleAddNewTemplate = (type: "open" | "middle" | "close") => {
    const newId = `template-${Date.now()}`;

    // 시간대별 기본값 설정
    const defaultTimes = {
      open: { startTime: "09:00", endTime: "13:00" },
      middle: { startTime: "12:00", endTime: "17:00" },
      close: { startTime: "16:00", endTime: "22:00" },
    };

    const newTemplateData = {
      ...DEFAULT_NEW_TEMPLATE,
      id: newId,
      type: type,
      name: type === "open" ? "오픈" : type === "middle" ? "미들" : "마감",
      startTime: defaultTimes[type].startTime,
      endTime: defaultTimes[type].endTime,
      color: TYPE_COLORS[type],
    };

    setNewTemplate(newTemplateData);
    setIsAddMode(true);
    setEditingTemplate(null);
  };

  // 템플릿 저장 (추가 또는 수정)
  const handleSaveTemplate = () => {
    // 입력 유효성 검사
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
  const handleInputChange = (field: keyof ShiftTemplate, value: any) => {
    setNewTemplate({
      ...newTemplate,
      [field]: value,
    });
  };

  // 색상 변경 핸들러
  const handleColorChange = (color: any) => {
    setNewTemplate({
      ...newTemplate,
      color: color.hex,
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
        <Box>
          <Tooltip title="매장 운영 시간 설정">
            <IconButton
              size="small"
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              color={settingsExpanded ? "primary" : "default"}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 운영 시간 설정 패널 */}
        {settingsExpanded && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              매장 운영 시간 설정
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="매장 오픈 시간"
                  type="time"
                  value={operatingHours.open}
                  onChange={(e) =>
                    setOperatingHours({
                      ...operatingHours,
                      open: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="매장 마감 시간"
                  type="time"
                  value={operatingHours.close}
                  onChange={(e) =>
                    setOperatingHours({
                      ...operatingHours,
                      close: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

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
          </Tabs>
        </Box>

        {/* 오픈 템플릿 */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {isAddMode && newTemplate.type === "open" ? (
              <TemplateEditor
                template={newTemplate}
                onInputChange={handleInputChange}
                onColorChange={handleColorChange}
                onCancel={() => {
                  setIsAddMode(false);
                  setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
                }}
                onSave={handleSaveTemplate}
                showColorPicker={showColorPicker}
                onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
              />
            ) : editingTemplate && editingTemplate.type === "open" ? (
              <TemplateEditor
                template={newTemplate}
                onInputChange={handleInputChange}
                onColorChange={handleColorChange}
                onCancel={() => {
                  setEditingTemplate(null);
                  setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
                }}
                onSave={handleSaveTemplate}
                showColorPicker={showColorPicker}
                onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
              />
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">
                    오픈 근무 템플릿 목록
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddNewTemplate("open")}
                    size="small"
                  >
                    새 오픈 템플릿
                  </Button>
                </Box>
                <TemplateList
                  templates={localTemplates.filter((t) => t.type === "open")}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                />
              </>
            )}
          </Box>
        </TabPanel>

        {/* 미들 템플릿 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {isAddMode && newTemplate.type === "middle" ? (
              <TemplateEditor
                template={newTemplate}
                onInputChange={handleInputChange}
                onColorChange={handleColorChange}
                onCancel={() => {
                  setIsAddMode(false);
                  setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
                }}
                onSave={handleSaveTemplate}
                showColorPicker={showColorPicker}
                onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
              />
            ) : editingTemplate && editingTemplate.type === "middle" ? (
              <TemplateEditor
                template={newTemplate}
                onInputChange={handleInputChange}
                onColorChange={handleColorChange}
                onCancel={() => {
                  setEditingTemplate(null);
                  setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
                }}
                onSave={handleSaveTemplate}
                showColorPicker={showColorPicker}
                onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
              />
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">
                    미들 근무 템플릿 목록
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddNewTemplate("middle")}
                    size="small"
                  >
                    새 미들 템플릿
                  </Button>
                </Box>
                <TemplateList
                  templates={localTemplates.filter((t) => t.type === "middle")}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                />
              </>
            )}
          </Box>
        </TabPanel>

        {/* 마감 템플릿 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {isAddMode && newTemplate.type === "close" ? (
              <TemplateEditor
                template={newTemplate}
                onInputChange={handleInputChange}
                onColorChange={handleColorChange}
                onCancel={() => {
                  setIsAddMode(false);
                  setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
                }}
                onSave={handleSaveTemplate}
                showColorPicker={showColorPicker}
                onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
              />
            ) : editingTemplate && editingTemplate.type === "close" ? (
              <TemplateEditor
                template={newTemplate}
                onInputChange={handleInputChange}
                onColorChange={handleColorChange}
                onCancel={() => {
                  setEditingTemplate(null);
                  setNewTemplate({ ...DEFAULT_NEW_TEMPLATE });
                }}
                onSave={handleSaveTemplate}
                showColorPicker={showColorPicker}
                onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
              />
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">
                    마감 근무 템플릿 목록
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddNewTemplate("close")}
                    size="small"
                  >
                    새 마감 템플릿
                  </Button>
                </Box>
                <TemplateList
                  templates={localTemplates.filter((t) => t.type === "close")}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                />
              </>
            )}
          </Box>
        </TabPanel>
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

// 템플릿 목록 컴포넌트
interface TemplateListProps {
  templates: ShiftTemplate[];
  onEdit: (template: ShiftTemplate) => void;
  onDelete: (templateId: string) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();

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
            <TableCell width="35%">템플릿 이름</TableCell>
            <TableCell width="20%">시간</TableCell>
            <TableCell align="center" width="15%">
              필요 인원
            </TableCell>
            <TableCell align="center" width="15%">
              색상
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
                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                  {template.name}
                </Typography>
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
              <TableCell align="center">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: template.color,
                    borderRadius: "4px",
                    border: "1px solid rgba(0,0,0,0.1)",
                    display: "inline-block",
                  }}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onEdit(template)}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(template.id)}
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

// 템플릿 편집기 컴포넌트
interface TemplateEditorProps {
  template: ShiftTemplate;
  onInputChange: (field: keyof ShiftTemplate, value: any) => void;
  onColorChange: (color: any) => void;
  onSave: () => void;
  onCancel: () => void;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onInputChange,
  onColorChange,
  onSave,
  onCancel,
  showColorPicker,
  onToggleColorPicker,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {template.id.includes("template-") ? "새 템플릿 만들기" : "템플릿 수정"}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="템플릿 이름"
            value={template.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            fullWidth
            size="small"
            margin="normal"
            placeholder="예: 오픈(토요일)"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" margin="normal">
            <InputLabel shrink>근무 유형</InputLabel>
            <Select
              value={template.type}
              onChange={(e) =>
                onInputChange(
                  "type",
                  e.target.value as "open" | "middle" | "close"
                )
              }
              label="근무 유형"
            >
              <MenuItem value="open">오픈</MenuItem>
              <MenuItem value="middle">미들</MenuItem>
              <MenuItem value="close">마감</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="시작 시간"
            type="time"
            value={template.startTime}
            onChange={(e) => onInputChange("startTime", e.target.value)}
            fullWidth
            size="small"
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="종료 시간"
            type="time"
            value={template.endTime}
            onChange={(e) => onInputChange("endTime", e.target.value)}
            fullWidth
            size="small"
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="필요 인원 수"
            type="number"
            value={template.requiredStaff}
            onChange={(e) =>
              onInputChange("requiredStaff", parseInt(e.target.value, 10))
            }
            fullWidth
            size="small"
            margin="normal"
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

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" size="small">
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ flexGrow: 1 }}>
                <InputLabel shrink>색상</InputLabel>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 1,
                    mt: 0.5,
                    cursor: "pointer",
                  }}
                  onClick={onToggleColorPicker}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: template.color,
                      borderRadius: 1,
                      mr: 1,
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  />
                  <Typography variant="body2">{template.color}</Typography>
                </Box>
              </Box>
            </Box>
            {showColorPicker && (
              <Box sx={{ mt: 1, position: "relative", zIndex: 10 }}>
                <Paper elevation={3} sx={{ p: 1, position: "absolute" }}>
                  <ReactColor.SketchPicker
                    color={template.color}
                    onChange={onColorChange}
                    disableAlpha
                  />
                </Paper>
              </Box>
            )}
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button onClick={onCancel} color="inherit" sx={{ mr: 1 }}>
          취소
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          저장
        </Button>
      </Box>
    </Paper>
  );
};

export default TemplateManagerDialog;
