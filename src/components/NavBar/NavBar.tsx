import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Menu, MenuItem, Container, Box } from '@mui/material';
// import { Menu as AccountCircle } from '@mui/icons-material';
import LogoutButton from '../LogoutButton'; // Adjust the path as necessary
import './NavBar.css';

const NavBar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const openMenu = Boolean(anchorEl);

//   const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#390063', paddingY: 2, boxShadow: 'none' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left side - Logo and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="/camrieLogo.png" alt="Logo" className="nav-logo" />
            </Typography>
            {/* Navigation Links */}
            {/* <Button sx={{ color: 'white', marginRight: 2 }}>About</Button>
            <Button sx={{ color: 'white', marginRight: 2 }}>Bug Report</Button> */}
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
