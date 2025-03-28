import React, { useState } from "react";
import { Box, Typography, Button, Tabs, Tab, Divider } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import TemplateClip from "./TemplateClip";

// 템플릿 타입 정의
interface Template {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  color: string;
  requiredPositions?: Record<string, number>;
  applicableDays?: number[];
}

interface TemplateListProps {
  templates: Template[];
  onAddTemplate?: (type: string) => void;
  onEditTemplate?: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  const [tabValue, setTabValue] = useState(0);

  // 템플릿 타입 추출 (중복 제거)
  const templateTypes = [...new Set(templates.map((t) => t.type))];

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 현재 선택된 템플릿 타입의 템플릿만 필터링
  const filteredTemplates = templates.filter(
    (t) => t.type === templateTypes[tabValue]
  );

  const renderTemplatesByType = (type: string) => {
    const typeTemplates = templates.filter((t) => t.type === type);

    return (
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">
            {type === "open"
              ? "오픈"
              : type === "middle"
              ? "미들"
              : type === "close"
              ? "마감"
              : type}{" "}
            템플릿
          </Typography>
          {onAddTemplate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onAddTemplate(type)}
              size="small"
            >
              새 템플릿
            </Button>
          )}
        </Box>

        {typeTemplates.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            py={3}
          >
            템플릿이 없습니다. 새로운 템플릿을 추가해주세요.
          </Typography>
        ) : (
          <Box>
            {typeTemplates.map((template) => (
              <TemplateClip
                key={template.id}
                template={template}
                onEdit={onEditTemplate}
                onDelete={onDeleteTemplate}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* 유형별 탭 */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {templateTypes.map((type, index) => (
          <Tab
            key={type}
            label={
              type === "open"
                ? "오픈"
                : type === "middle"
                ? "미들"
                : type === "close"
                ? "마감"
                : type
            }
            sx={{
              color:
                filteredTemplates.length > 0
                  ? filteredTemplates[0].color
                  : "inherit",
              fontWeight: "bold",
            }}
          />
        ))}
      </Tabs>

      {/* 선택된 탭의 템플릿 목록 */}
      {templateTypes.length > 0 &&
        renderTemplatesByType(templateTypes[tabValue])}

      {/* 템플릿이 하나도 없는 경우 */}
      {templates.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" gutterBottom>
            등록된 템플릿이 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            시간대별 근무 템플릿을 등록하여 스케줄 작성을 더 효율적으로
            관리하세요.
          </Typography>
          {onAddTemplate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onAddTemplate("open")}
            >
              오픈 템플릿 추가
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TemplateList;
