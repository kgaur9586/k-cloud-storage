import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { useLogto } from '@logto/react';
import 'react-toastify/dist/ReactToastify.css';
import { LoginPage } from './pages/auth/LoginPage';
import { CallbackPage } from './pages/auth/CallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import SettingsPage from './pages/settings/SettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { setAccessToken } from './services/api';

/**
 * Material-UI theme configuration
 * Modern, clean design with primary blue color
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

/**
 * Main App component
 * Handles routing and theme
 */
function App() {
  const { isAuthenticated, isLoading: isLogtoLoading, getAccessToken } = useLogto();
  const [isReady, setIsReady] = useState(false);
  const authInitialized = useRef(false);

  // Restore access token on app load/refresh
  useEffect(() => {
    // Only initialize once
    if (authInitialized.current) return;

    const initAuth = async () => {
      // Wait for Logto to finish loading
      if (isLogtoLoading) return;

      authInitialized.current = true;

      if (isAuthenticated) {
        try {
          const token = await getAccessToken();
          if (token) {
            setAccessToken(token);
            console.log('Access token restored on app load');
          }
        } catch (error) {
          console.error('Failed to restore access token', error);
        }
      } else {
        // Clear token if not authenticated
        setAccessToken(null);
      }
      setIsReady(true);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLogtoLoading]);

  if (!isReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
