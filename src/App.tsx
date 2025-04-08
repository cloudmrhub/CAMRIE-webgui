// src/App.tsx
import { useState } from 'react';
import { Container, Tabs, Tab, Box, Typography } from '@mui/material';
import HomeTab from './components/HomeTab';
import JobForm from './components/JobForm';
import ResultsTab from './components/ResultsTab'; // create if needed
import Login from './components/Login';
import LogoutButton from './components/LogoutButton';
import { useAppSelector } from './features/hooks';

function App() {
  const [tabIndex, setTabIndex] = useState(0);
  const token = useAppSelector((state) => state.auth.token);

  // If not logged in, show login page only
  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Login onLogin={() => setTabIndex(0)} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Logout button */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        <Typography variant="body2" mr={2}>Logged in</Typography>
        <LogoutButton />
      </Box>

      {/* Tabs */}
      <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} centered>
        <Tab label="Home" />
        <Tab label="Setup" />
        <Tab label="Results" />
      </Tabs>

      <Box mt={4}>
        {tabIndex === 0 && <HomeTab />}
        {tabIndex === 1 && <JobForm />}
        {tabIndex === 2 && <ResultsTab />}
      </Box>
    </Container>
  );
}

export default App;
