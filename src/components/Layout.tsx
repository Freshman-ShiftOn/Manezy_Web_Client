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
  Menu,
  MenuItem,
  ListItemAvatar,
  Popover,
  Paper,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Container,
  CircularProgress,
  Snackbar,
  Alert,
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
  Add as AddIcon,
  Store as StoreIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  getStoreInfo,
  getEmployees,
  generateDummyData,
  getBranchList,
  getBranchDetail,
} from "../services/api";
import { useEffect } from "react";
import { Store } from "../lib/types";
import { colors } from "../theme";
import { LS_KEYS } from "../services/api";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";

const drawerWidth = 260;

// 더미 알림 데이터
const dummyNotifications = [
  {
    id: 1,
    title: "대타 요청",
    message: "김영희님이 내일 오후 시프트 대타를 요청했습니다.",
    time: "10분 전",
    read: false,
  },
  {
    id: 2,
    title: "급여 확정",
    message: "이번 달 급여가 확정되었습니다. 확인해주세요.",
    time: "1시간 전",
    read: false,
  },
  {
    id: 3,
    title: "스케줄 변경",
    message: "다음 주 월요일 스케줄이 변경되었습니다.",
    time: "어제",
    read: true,
  },
];

function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [notificationCount, setNotificationCount] = useState(2);

  // 브랜치 컨텍스트 사용
  const {
    branches,
    currentBranch,
    branchDetail,
    selectedBranchId,
    setSelectedBranchId,
    isLoading,
  } = useBranch();

  // 디버깅을 위한 브랜치 상태 로그
  useEffect(() => {
    console.log("Layout - 브랜치 상태:", {
      branches: branches?.length || 0,
      currentBranch: currentBranch?.name || null,
      isLoading,
    });
  }, [branches, currentBranch, isLoading]);

  // 알림 메뉴 상태
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const notificationOpen = Boolean(notificationAnchorEl);

  // 스토어 메뉴 상태
  const [storeAnchorEl, setStoreAnchorEl] = useState<null | HTMLElement>(null);
  const storeMenuOpen = Boolean(storeAnchorEl);

  // 스토어 메뉴가 열릴 때 상태 로깅
  useEffect(() => {
    if (storeMenuOpen) {
      console.log("매장 선택 메뉴 열림 - 브랜치 목록 상태:", {
        branches: branches?.length || 0,
        브랜치목록: branches,
        isLoading,
      });
    }
  }, [storeMenuOpen, branches, isLoading]);

  // 사용자 메뉴 상태
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const userMenuOpen = Boolean(userMenuAnchorEl);

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { logout } = useAuth();

  // 자동으로 모바일에서는 드로어 닫기
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  // 브랜치 상세 정보가 변경될 때 storeInfo 업데이트
  useEffect(() => {
    if (branchDetail) {
      setStoreInfo({
        id: String(branchDetail.id),
        name: branchDetail.name,
        address: branchDetail.adress || "",
        phoneNumber: branchDetail.dial_numbers || "",
        baseHourlyRate:
          typeof branchDetail.basic_cost === "string"
            ? parseFloat(branchDetail.basic_cost)
            : (branchDetail.basic_cost as number) || 9860,
        openingHour: branchDetail.openingHour || "09:00",
        closingHour: branchDetail.closingHour || "22:00",
      });
    }
  }, [branchDetail]);

  const handleNavigation = (path: string) => {
    console.log("Navigating to:", path);
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // 현재 활성화된 메뉴 확인
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 알림 메뉴 열기
  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  // 알림 메뉴 닫기
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // 알림 읽음 처리
  const handleReadNotification = (id: number) => {
    setNotificationCount((prev) => Math.max(0, prev - 1));
    // 여기서 실제로는 API를 호출하여 알림을 읽음 처리해야 함
  };

  // 알림 모두 읽음 처리
  const handleReadAllNotifications = () => {
    setNotificationCount(0);
    // 여기서 실제로는 API를 호출하여 모든 알림을 읽음 처리해야 함
    handleNotificationClose();
  };

  // 스토어 변경 처리
  const handleStoreChange = (storeId: string | number) => {
    console.log(
      `브랜치 변경 시도: ID ${storeId}, 이전 선택된 ID: ${selectedBranchId}`
    );

    // 이미 선택된 브랜치면 다시 선택하지 않음
    if (selectedBranchId === storeId) {
      console.log(`이미 선택된 브랜치(${storeId})입니다.`);
      handleStoreMenuClose();
      return;
    }

    // 브랜치 컨텍스트의 상태 업데이트
    setSelectedBranchId(storeId);

    // 브랜치 목록에서 해당 브랜치 정보 찾기
    const selectedBranch = branches.find((branch) => branch.id === storeId);
    console.log(
      `브랜치 ID ${storeId} 선택됨, 브랜치 정보:`,
      selectedBranch || "정보 없음"
    );

    // 알림 표시 (실제 상황에서는 필요에 따라 제거 가능)
    setSnackbarOpen(true);
    setSnackbarMessage(
      `${selectedBranch?.name || `ID: ${storeId}`} 브랜치로 전환되었습니다.`
    );

    handleStoreMenuClose();
  };

  // 드롭다운 메뉴의 현재 상태를 여닫는 함수
  const openStoreMenu = (event: React.MouseEvent<HTMLElement>) => {
    console.log("매장 선택 메뉴 열기");
    setStoreAnchorEl(event.currentTarget);
  };

  // 스낵바(알림) 상태 관리
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 스낵바 닫기
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // 스토어 선택 메뉴 닫기
  const handleStoreMenuClose = () => {
    setStoreAnchorEl(null);
  };

  // 사용자 메뉴 열기
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  // 사용자 메뉴 닫기
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  // 새 스토어 등록 (핸들러 수정 - 새 페이지 경로 사용)
  const handleAddNewStore = () => {
    handleStoreMenuClose();
    // navigate("/settings/store"); // 이전 경로
    navigate("/setup/wizard?mode=new-store"); // 마법사를 사용하여 새 지점 추가
  };

  // 데이터 초기화 핸들러
  const handleResetDummyData = () => {
    try {
      // 로컬 스토리지 초기화
      localStorage.removeItem(LS_KEYS.STORE);
      localStorage.removeItem(LS_KEYS.EMPLOYEES);
      localStorage.removeItem(LS_KEYS.SHIFTS);
      localStorage.removeItem(LS_KEYS.SETUP_COMPLETE);
      localStorage.removeItem(LS_KEYS.SUBSTITUTE_REQUESTS);
      localStorage.removeItem(LS_KEYS.SCHEDULE_CHANGE_REQUESTS);
      localStorage.removeItem(LS_KEYS.SHIFT_APPROVAL_REQUESTS);
      localStorage.removeItem(LS_KEYS.EMPLOYEE_NOTIFICATIONS);
      localStorage.removeItem(LS_KEYS.EMPLOYEE_AVAILABILITIES);

      // 더미 데이터 생성
      generateDummyData();

      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error("데이터 초기화 중 오류 발생:", error);
    }
    handleStoreMenuClose();
  };

  // Logout Handler
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const menuItems = [
    {
      text: "대시보드",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "스케줄",
      icon: <CalendarIcon />,
      path: "/schedule",
    },
    {
      text: "급여 관리",
      icon: <PaymentIcon />,
      path: "/payroll",
    },
    {
      text: "직원 관리",
      icon: <GroupIcon />,
      path: "/employees",
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* AppBar (로고 제거) */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "background.paper", // 이전 배경색
          borderBottom: `1px solid ${theme.palette.divider}`, // 하단 경계선
          color: "text.primary", // 이전 텍스트 색상
        }}
        elevation={1}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            paddingRight: { xs: 1, sm: 2 },
          }}
        >
          {/* 좌측: 메뉴 아이콘(모바일), 매장 선택 */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            {/* 매장 선택 버튼 (그림자 제거) */}
            <Button
              color="inherit"
              onClick={openStoreMenu}
              startIcon={<StoreIcon sx={{ color: "text.secondary" }} />}
              sx={{
                textTransform: "none",
                boxShadow: "none",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {currentBranch?.name || storeInfo?.name || "매장 선택"}
              </Typography>
              <ChevronRightIcon
                sx={{
                  fontSize: 20,
                  ml: 0.5,
                  color: "text.secondary",
                  transform: storeMenuOpen ? "rotate(90deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                }}
              />
            </Button>
          </Box>
          {/* 우측: 알림, 사용자 아바타 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="알림">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="사용자 메뉴">
              <IconButton onClick={handleUserMenuOpen} sx={{ p: 0, ml: 1.5 }}>
                <Avatar
                  alt="User Name"
                  sx={{ bgcolor: colors.secondary, width: 36, height: 36 }}
                >
                  U
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 사이드바 (헤더에 로고 추가) */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            border: "none",
            boxShadow: drawerOpen ? theme.shadows[2] : "none",
            transition: theme.transitions.create(["width", "box-shadow"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            bgcolor: "background.paper", // 배경색 명시
          },
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 200"
              width="36"
              height="36"
            >
              <circle cx="100" cy="100" r="90" fill="#f0f4ff" />
              <path
                d="M55 50 L55 150 L75 150 L75 90 L100 125 L125 90 L125 150 L145 150 L145 50 L125 50 L100 90 L75 50 Z"
                fill={colors.primary}
              />
              <rect
                x="50"
                y="160"
                width="100"
                height="8"
                rx="4"
                fill={colors.secondary}
              />
            </svg>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 700, color: colors.primary, ml: 1 }}
            >
              Manezy
            </Typography>
          </Box>
        </Toolbar>
        <Divider />
        <Box
          sx={{
            overflow: "auto",
            p: 1.5,
            height: "calc(100% - 64px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <List sx={{ pt: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    mb: 0.5,
                    color: isActive(item.path)
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    backgroundColor: isActive(item.path)
                      ? alpha(theme.palette.primary.main, 0.08)
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isActive(item.path)
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.text.primary, 0.04),
                    },
                    transition: "background-color 0.2s ease-in-out",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 500,
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: "auto", pt: 1 }}>
            {storeInfo && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: 2,
                  bgcolor: "grey.100",
                  border: "none",
                }}
              >
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mb: 0.5, fontWeight: 500, color: "text.secondary" }}
                >
                  영업 시간
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccessTimeIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {storeInfo.openingHour} - {storeInfo.closingHour}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mb: 0.5, fontWeight: 500, color: "text.secondary" }}
                >
                  기본 시급
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  ₩{storeInfo.baseHourlyRate.toLocaleString()}
                </Typography>
              </Paper>
            )}
            <List sx={{ pb: 1 }}>
              <ListItem key="지점 설정" disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  selected={isActive("/settings/store")}
                  onClick={() => handleNavigation("/settings/store")}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    color: isActive("/settings/store")
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    backgroundColor: isActive("/settings/store")
                      ? alpha(theme.palette.primary.main, 0.08)
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isActive("/settings/store")
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.text.primary, 0.04),
                    },
                    transition: "background-color 0.2s ease-in-out",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="지점 설정"
                    primaryTypographyProps={{
                      fontWeight: isActive("/settings/store") ? 600 : 500,
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={handleResetDummyData}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    color: theme.palette.warning.dark,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.warning.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 36, color: theme.palette.warning.dark }}
                  >
                    <RefreshIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="더미데이터 리셋"
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* 메인 컨텐츠 영역 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 0, // *** 모든 패딩 제거 ***
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        {/* Container 패딩 값 수정 */}
        <Container
          maxWidth="xl"
          sx={{ pt: "15px", pb: 0, px: "6px" /* 상:15px, 하:0, 좌우:6px */ }}
        >
          <Outlet />
        </Container>
      </Box>

      {/* 알림 팝오버 */}
      <Popover
        id="notifications-popover"
        open={notificationOpen}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 320,
            overflow: "hidden",
            mt: 1.5,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              알림
            </Typography>
            <Button
              size="small"
              onClick={handleReadAllNotifications}
              color="primary"
            >
              모두 읽음
            </Button>
          </Box>
        </Box>

        <List sx={{ p: 0, maxHeight: 320, overflowY: "auto" }}>
          {dummyNotifications.length > 0 ? (
            dummyNotifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: notification.read
                    ? "transparent"
                    : "rgba(64, 80, 181, 0.04)",
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleReadNotification(notification.id)}
                  >
                    {notification.read ? (
                      <CloseIcon fontSize="small" />
                    ) : (
                      <Badge
                        variant="dot"
                        color="primary"
                        overlap="circular"
                        sx={{
                          "& .MuiBadge-badge": {
                            backgroundColor: colors.primary,
                          },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </Badge>
                    )}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: notification.read ? 400 : 600 }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.primary", mb: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {notification.time}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="알림이 없습니다."
                sx={{ textAlign: "center", py: 2 }}
              />
            </ListItem>
          )}
        </List>
      </Popover>

      {/* 매장 선택 메뉴 */}
      <Menu
        id="store-menu"
        anchorEl={storeAnchorEl}
        open={storeMenuOpen}
        onClose={handleStoreMenuClose}
        MenuListProps={{
          "aria-labelledby": "store-button",
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 220,
            maxHeight: 300,
            overflow: "auto",
            mt: 1.5,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            매장 선택
          </Typography>
        </MenuItem>

        <Divider />

        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 2,
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="caption" sx={{ mt: 1 }}>
              브랜치 목록 로딩 중...
            </Typography>
          </Box>
        ) : branches && branches.length > 0 ? (
          branches.map((branch) => (
            <MenuItem
              key={branch.id}
              selected={selectedBranchId === branch.id}
              onClick={() => handleStoreChange(branch.id)}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                px: 1.5,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ListItemIcon>
                <StoreIcon
                  fontSize="small"
                  sx={{
                    color:
                      selectedBranchId === branch.id
                        ? colors.primary
                        : "text.secondary",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={branch.name}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: selectedBranchId === branch.id ? 600 : 400,
                }}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled sx={{ opacity: 0.7 }}>
            <ListItemText
              primary="가입된 지점이 없습니다"
              secondary="새 매장을 추가하거나 기존 매장에 가입하세요"
            />
          </MenuItem>
        )}

        <Divider />

        <MenuItem
          onClick={handleAddNewStore}
          sx={{ color: colors.primary, borderRadius: 1, mx: 1, mt: 0.5 }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" sx={{ color: colors.primary }} />
          </ListItemIcon>
          <ListItemText primary="새 매장 추가" />
        </MenuItem>
      </Menu>

      {/* 사용자 메뉴 */}
      <Menu
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorEl={userMenuAnchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            navigate("/settings/account");
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          계정 설정
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>

      {/* 브랜치 변경 성공 알림 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Layout;

// If you still get "not a module" errors, you can add this line:
// export {};
