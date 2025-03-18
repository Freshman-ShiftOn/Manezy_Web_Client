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
import { getStoreInfo, getEmployees, generateDummyData } from "../services/api";
import { useEffect } from "react";
import { Store } from "../lib/types";
import { colors } from "../theme";
import { LS_KEYS } from "../services/api";

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

// 더미 스토어 데이터
const dummyStores = [
  {
    id: "store1",
    name: "메인 카페",
    address: "서울시 강남구 역삼동 123-45",
    phoneNumber: "02-1234-5678",
    baseHourlyRate: 9620,
    openingHour: "09:00",
    closingHour: "22:00",
  },
  {
    id: "store2",
    name: "홍대 지점",
    address: "서울시 마포구 서교동 456-78",
    phoneNumber: "02-2345-6789",
    baseHourlyRate: 9620,
    openingHour: "08:00",
    closingHour: "23:00",
  },
];

function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [notificationCount, setNotificationCount] = useState(2);

  // 알림 메뉴 상태
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const notificationOpen = Boolean(notificationAnchorEl);

  // 스토어 메뉴 상태
  const [storeAnchorEl, setStoreAnchorEl] = useState<null | HTMLElement>(null);
  const storeMenuOpen = Boolean(storeAnchorEl);

  // 사용자 메뉴 상태
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const userMenuOpen = Boolean(userMenuAnchorEl);

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
        // 실제 API 호출
        const info = await getStoreInfo();
        setStoreInfo(info);

        // 더미 데이터 추가
        if (info && info.id) {
          setStores([info, ...dummyStores]);
          setSelectedStoreId(info.id);
        } else {
          // If info is null or has no id, use dummy data
          setStores(dummyStores);
          if (dummyStores.length > 0) {
            setSelectedStoreId(dummyStores[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load store info:", error);
        // In case of error, still set some default data
        setStores(dummyStores);
        if (dummyStores.length > 0) {
          setSelectedStoreId(dummyStores[0].id);
        }
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

  // 스토어 선택 메뉴 열기
  const handleStoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStoreAnchorEl(event.currentTarget);
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

  // 스토어 변경 처리
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    // 여기서 실제로는 API를 호출하여 선택된 스토어의 데이터를 로드해야 함

    // 선택된 스토어 정보 업데이트
    const selected = stores.find((store) => store.id === storeId);
    if (selected) {
      setStoreInfo(selected);
    }

    handleStoreMenuClose();
  };

  // 새 스토어 등록
  const handleAddNewStore = () => {
    handleStoreMenuClose();
    navigate("/setup");
  };

  // 데이터 초기화 및 메가커피 서울대점 데이터 로드
  const handleResetAndLoadDummyData = () => {
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

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
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
      text: "직원 관리",
      icon: <GroupIcon />,
      path: "/employees",
    },
    {
      text: "급여 관리",
      icon: <PaymentIcon />,
      path: "/payroll",
    },
    {
      text: "설정",
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />

      {/* 상단 앱바 */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: "background.paper",
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

            {/* 로고와 서비스명 */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  mr: 1,
                  display: { xs: "none", sm: "block" },
                  width: 36,
                  height: 36,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 200 200"
                  width="100%"
                  height="100%"
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
              </Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: colors.primary,
                  display: { xs: "none", sm: "block" },
                }}
              >
                Manezy
              </Typography>
            </Box>

            {/* 선택한 매장 이름 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                ml: { xs: 0, sm: 3 },
                cursor: "pointer",
                px: 2,
                py: 0.5,
                borderRadius: "50px",
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
              onClick={handleStoreMenuOpen}
            >
              <StoreIcon
                sx={{ fontSize: 20, mr: 1, color: "text.secondary" }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {stores.find((store) => store.id === selectedStoreId)?.name ||
                  "스토어 선택"}
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
            </Box>
          </Box>

          {/* 우측 아이콘들 */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* 알림 아이콘 */}
            <Tooltip title="알림">
              <IconButton
                size="large"
                color="inherit"
                onClick={handleNotificationOpen}
                sx={{ ml: 1 }}
              >
                <Badge
                  badgeContent={notificationCount}
                  color="error"
                  overlap="circular"
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* 사용자 아바타 */}
            <Tooltip title="계정 설정">
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  ml: 1.5,
                  p: 0.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: colors.primary,
                    width: 36,
                    height: 36,
                  }}
                >
                  <PersonIcon />
                </Avatar>
              </IconButton>
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
          },
        }}
      >
        <Toolbar />

        <Box sx={{ overflow: "auto", p: 2, height: "100%" }}>
          {/* 메뉴 항목들 */}
          <List sx={{ pt: 0 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive(item.path)
                        ? colors.primary
                        : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* 영업 시간 정보 */}
          {storeInfo && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 2,
                borderRadius: 2,
                backgroundColor: "background.default",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                영업 시간
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <AccessTimeIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary", fontSize: 18 }}
                />
                <Typography variant="body2">
                  {storeInfo.openingHour} - {storeInfo.closingHour}
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                시급
              </Typography>
              <Typography variant="body2">
                {storeInfo.baseHourlyRate.toLocaleString()}원
              </Typography>
            </Paper>
          )}

          {/* 하단 로그아웃 버튼 */}
          <Box sx={{ mt: "auto", pt: 4 }}>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                mt: 2,
                borderColor: theme.palette.divider,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              로그아웃
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* 메인 컨텐츠 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 2 }}>
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

        {stores.map((store) => (
          <MenuItem
            key={store.id}
            selected={selectedStoreId === store.id}
            onClick={() => handleStoreChange(store.id)}
            sx={{
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              px: 1.5,
            }}
          >
            <ListItemIcon>
              <StoreIcon
                fontSize="small"
                sx={{
                  color:
                    selectedStoreId === store.id
                      ? colors.primary
                      : "text.secondary",
                }}
              />
            </ListItemIcon>
            <ListItemText primary={store.name} />
          </MenuItem>
        ))}

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

        <MenuItem
          onClick={handleResetAndLoadDummyData}
          sx={{ color: colors.secondary, borderRadius: 1, mx: 1, mt: 0.5 }}
        >
          <ListItemIcon>
            <RefreshIcon fontSize="small" sx={{ color: colors.secondary }} />
          </ListItemIcon>
          <ListItemText primary="메가커피 서울대점 데이터 리셋" />
        </MenuItem>
      </Menu>

      {/* 사용자 메뉴 */}
      <Menu
        id="user-menu"
        anchorEl={userMenuAnchorEl}
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        MenuListProps={{
          "aria-labelledby": "user-button",
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 200,
            mt: 1.5,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            navigate("/settings");
          }}
          sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="계정 설정" />
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="로그아웃" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Layout;

// If you still get "not a module" errors, you can add this line:
// export {};
