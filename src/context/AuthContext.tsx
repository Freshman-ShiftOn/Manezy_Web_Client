import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void; // Simulate login with a token
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Check localStorage for an existing token on initial load
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("authToken")
  );

  const login = useCallback((token: string) => {
    // In a real app, you'd verify the token with a backend
    localStorage.setItem("authToken", token); // Store token
    setIsAuthenticated(true);
    console.log("User logged in (simulated)");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken"); // Remove token
    setIsAuthenticated(false);
    console.log("User logged out");
    // Optionally redirect to login page here or let ProtectedRoute handle it
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
