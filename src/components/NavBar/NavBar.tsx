import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import LogoutButton from '../LogoutButton';
import './NavBar.css';

const NavBar = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#390063', paddingY: 2, boxShadow: 'none' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left side - Logo and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="/camrieLogo.png" alt="Logo" className="nav-logo" />
            </Typography>
          </Box>

          {/* Right side - Logged in status and LogoutButton */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'white', mr: 2 }}>
              Logged in
            </Typography>
            <LogoutButton />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavBar;
