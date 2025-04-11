// src/App.tsx
import { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Box, Typography } from '@mui/material';
import HomeTab from './components/HomeTab';
import JobForm from './components/JobForm';
import ResultsTab from './components/ResultsTab'; // create if needed
import Login from './components/Login';
import NavBar from './components/NavBar/NavBar'; 
// import LogoutButton from './components/LogoutButton';
import { useAppSelector } from './features/hooks';
import Footer from './components/Footer';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css'

// Create a theme with custom primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#580f8b', // Set the primary color to #580F8B
    },
  },
});

function App() {
  const [tabIndex, setTabIndex] = useState(0);
  const token = useAppSelector((state) => state.auth.token);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // If not logged in, show login page only
  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: windowHeight,
        }}>
          <Login onLogin={() => setTabIndex(0)} />
          <Footer />
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <NavBar />
      <Container maxWidth="lg" sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: windowHeight,
        }}>
        {/* Logout button */}
        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        </Box>

        {/* Tabs */}
        <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} sx={{ borderBottom: '1px solid #dcdcdc'}}>
          <Tab label="Home" />
          <Tab label="Setup" />
          <Tab label="Results" />
        </Tabs>

        <Box mt={4}>
          {tabIndex === 0 && <HomeTab />}
          {tabIndex === 1 && <JobForm />}
          {tabIndex === 2 && <ResultsTab />}
        </Box>

        <Footer />
      </Container>
    </ThemeProvider>

  );
}

export default App;
