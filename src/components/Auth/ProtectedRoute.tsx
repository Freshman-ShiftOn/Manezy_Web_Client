import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress, Typography } from "@mui/material"; // Optional: for loading state

interface ProtectedRouteProps {
  // You can add props here if needed, e.g., required roles/permissions
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation(); // Get current location to redirect back after login

  // Optional: Add a loading state if auth check is async in the future
  // const [isLoading, setIsLoading] = useState(true);
  // useEffect(() => {
  //   // Simulate async check
  //   setTimeout(() => setIsLoading(false), 50);
  // }, []);

  // if (isLoading) {
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  //       <CircularProgress />
  //       <Typography sx={{ ml: 2 }}>Checking authentication...</Typography>
  //     </Box>
  //   );
  // }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after they log in.
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child route component
  return <Outlet />;
};

export default ProtectedRoute;
