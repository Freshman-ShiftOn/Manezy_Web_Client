import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  CssBaseline,
  IconButton,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Group as GroupIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
} from "@mui/icons-material";
import { getStoreInfo } from "../services/api";
import { useEffect } from "react";
import { Store } from "../lib/types";

const drawerWidth = 260;

function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // 자동으로 모바일에서는 드로어 닫기
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  // 스토어 정보 가져오기
  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        const info = await getStoreInfo();
        setStoreInfo(info);
      } catch (error) {
        console.error("Failed to load store info:", error);
      }
    };

    loadStoreInfo();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // 현재 활성화된 메뉴 확인
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />

      {/* 상단 앱바 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
          backgroundColor: "white",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
              edge="start"
              sx={{ mr: 2, display: { sm: "none", xs: "block" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                color: "primary.main",
              }}
            >
              Manezy
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="알림">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={storeInfo?.name || "매장 정보"}>
              <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "primary.main",
                    fontSize: "0.9rem",
                  }}
                >
                  {storeInfo?.name?.substring(0, 1) || "M"}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    ml: 1,
                    fontWeight: 500,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {storeInfo?.name || "내 매장"}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 사이드바 */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.05)",
            borderRight: "none",
            bgcolor: "#fafafa",
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* 스토어 정보 카드 */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "white",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", fontSize: "1rem" }}
            >
              {storeInfo?.name || "매장 이름"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {storeInfo?.address || "매장 주소"}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleNavigation("/settings")}
              startIcon={<SettingsIcon />}
              sx={{ mt: 1 }}
            >
              매장 설정
            </Button>
          </Box>

          {/* 메인 메뉴 */}
          <List sx={{ flexGrow: 1 }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation("/dashboard")}
                selected={isActive("/dashboard")}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <DashboardIcon
                    color={isActive("/dashboard") ? "primary" : "inherit"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="대시보드"
                  primaryTypographyProps={{
                    fontWeight: isActive("/dashboard") ? "bold" : "normal",
                    color: isActive("/dashboard") ? "primary.main" : "inherit",
                  }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation("/schedule")}
                selected={isActive("/schedule")}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <CalendarIcon
                    color={isActive("/schedule") ? "primary" : "inherit"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="스케줄 관리"
                  primaryTypographyProps={{
                    fontWeight: isActive("/schedule") ? "bold" : "normal",
                    color: isActive("/schedule") ? "primary.main" : "inherit",
                  }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation("/employees")}
                selected={isActive("/employees")}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <GroupIcon
                    color={isActive("/employees") ? "primary" : "inherit"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="알바생 관리"
                  primaryTypographyProps={{
                    fontWeight: isActive("/employees") ? "bold" : "normal",
                    color: isActive("/employees") ? "primary.main" : "inherit",
                  }}
                />
                <Badge badgeContent={2} color="primary" sx={{ mr: 1 }} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation("/payroll")}
                selected={isActive("/payroll")}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <PaymentIcon
                    color={isActive("/payroll") ? "primary" : "inherit"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="급여 관리"
                  primaryTypographyProps={{
                    fontWeight: isActive("/payroll") ? "bold" : "normal",
                    color: isActive("/payroll") ? "primary.main" : "inherit",
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>

          {/* 하단 메뉴 */}
          <Box sx={{ mt: "auto" }}>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation("/settings")}
                selected={isActive("/settings")}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <SettingsIcon
                    color={isActive("/settings") ? "primary" : "inherit"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="지점 설정"
                  primaryTypographyProps={{
                    fontWeight: isActive("/settings") ? "bold" : "normal",
                    color: isActive("/settings") ? "primary.main" : "inherit",
                  }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  /* Logout logic here */
                }}
                sx={{
                  borderRadius: 2,
                  color: "text.secondary",
                }}
              >
                <ListItemIcon>
                  <LogoutIcon color="inherit" />
                </ListItemIcon>
                <ListItemText primary="로그아웃" />
              </ListItemButton>
            </ListItem>
          </Box>
        </Box>
      </Drawer>

      {/* 메인 콘텐츠 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          overflow: "auto",
          height: "100vh",
          bgcolor: "#f5f5f7",
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;

// If you still get "not a module" errors, you can add this line:
// export {};
