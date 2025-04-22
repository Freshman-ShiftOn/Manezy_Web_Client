import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Store as StoreIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { Store, Employee } from "../../../lib/types";

interface WizardStepCompleteProps {
  storeData: Partial<Store>;
  employees: Partial<Employee>[];
  onComplete: () => void;
}

const WizardStepComplete: React.FC<WizardStepCompleteProps> = ({
  storeData,
  employees,
  onComplete,
}) => {
  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <CheckCircleIcon
          color="success"
          sx={{ fontSize: 80, mb: 2, opacity: 0.9 }}
        />
        <Typography variant="h4" gutterBottom fontWeight="600">
          모든 설정이 완료되었습니다!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          이제 매장을 관리할 준비가 되었습니다. 아래 내용을 확인하고 대시보드로
          이동하세요.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <StoreIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6" fontWeight="500">
                  매장 정보
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemText
                    primary="매장명"
                    secondary={storeData.name || "정보 없음"}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="주소"
                    secondary={storeData.address || "정보 없음"}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="연락처"
                    secondary={storeData.phoneNumber || "정보 없음"}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="영업시간"
                    secondary={
                      storeData.openingHour && storeData.closingHour
                        ? `${storeData.openingHour} - ${storeData.closingHour}`
                        : "정보 없음"
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <GroupIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6" fontWeight="500">
                  직원 정보
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {employees.length > 0 ? (
                <List disablePadding>
                  {employees.slice(0, 5).map((employee, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemText
                        primary={employee.name || "이름 없음"}
                        secondary={employee.role || "역할 미지정"}
                      />
                    </ListItem>
                  ))}
                  {employees.length > 5 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      외 {employees.length - 5}명 더...
                    </Typography>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  등록된 직원이 없습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={onComplete}
          endIcon={<ArrowForwardIcon />}
          sx={{ minWidth: 200, py: 1.5 }}
        >
          대시보드로 이동
        </Button>
      </Box>
    </Box>
  );
};

export default WizardStepComplete;
