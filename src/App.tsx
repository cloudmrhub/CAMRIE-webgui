// src/App.tsx
import { useState } from 'react';
import { Container, Tabs, Tab, Box } from '@mui/material';
import HomeTab from './components/HomeTab';
import JobForm from './components/JobForm';
import ResultsTab from './components/ResultsTab'; // create if needed
import Login from './components/Login';
import { useAppSelector } from './features/hooks';
import Footer from './components/Footer';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import NavBar from './components/NavBar/NavBar';
import './App.css'

// Create a theme with custom primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#580f8b', // Set the primary color to #580F8B
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1500, // customized
      xl: 1636,
    },
  }
});

function App() {
  const [tabIndex, setTabIndex] = useState(0);
  const token = useAppSelector((state) => state.auth.token);

  // If not logged in, show login page only
  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{
          display: 'flex',
          flexDirection: 'column',
          // minHeight: '100vh'
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
      <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        // minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg" 
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        mt: 4,
        // pt: 4,
      }}>

        {/* Tabs */}
        <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} sx={{ borderBottom: '1px solid #dcdcdc' }}>
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
    </Box>
      
    </ThemeProvider>
  );
}

export default App;
