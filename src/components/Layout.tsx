import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItemButton,
} from "@mui/material";

const drawerWidth = 200;

function Layout() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Manezy Web
          </Typography>
          <Button color="inherit" onClick={() => navigate("/setup")}>
            Setup Wizard
          </Button>
        </Toolbar>
      </AppBar>

      {/* 사이드바 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, mt: 8 },
        }}
      >
        <List>
          <ListItemButton onClick={() => navigate("/dashboard")}>
            대시보드
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/schedule")}>
            스케줄 관리
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/employees")}>
            알바생 관리
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/payroll")}>
            급여 관리
          </ListItemButton>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, ml: `${drawerWidth}px`, mt: 8, p: 2 }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

// If you still get “not a module” errors, you can add this line:
// export {};
