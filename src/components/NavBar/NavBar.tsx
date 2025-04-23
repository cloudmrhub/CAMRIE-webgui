import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  MenuItem,
  Divider,
  Button,
  Menu,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './NavBar.css';
import LogoutButton from '../LogoutButton';
import { useAppSelector } from '../../features/hooks';

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: 'rgb(55, 65, 81)',
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, ' +
      'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, ' +
      'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, ' +
      'rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:hover': {
        backgroundColor: 'transparent',
      },
      '&.Mui-focusVisible': {
        backgroundColor: 'transparent',
      },
      '&:active': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

const NavBar = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const email = useAppSelector((state) => state.auth.profile?.email) || 'Loading...';

  return (
    <AppBar position="static" sx={{ backgroundColor: '#390063', paddingY: 2, boxShadow: 'none' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left - Logo and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="/camrieLogo.png" alt="Logo" className="nav-logo" />
            </Typography>
            <Button disabled sx={{ ml: 2, textTransform: 'none', color: 'white !important', opacity: 0.6 }}>
              About
            </Button>
            <Button disabled sx={{ ml: 1, textTransform: 'none', color: 'white !important', opacity: 0.6 }}>
              Bug Report
            </Button>
          </Box>

          {/* Right - User Dropdown */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Button
              disableRipple
              id="user-menu-button"
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
              variant="contained"
              disableElevation
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                backgroundColor: 'transparent',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  background: 'none'
                }
              }}
            >
              {email}
            </Button>

            <StyledMenu
              id="user-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'user-menu-button',
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <LogoutButton />
            </StyledMenu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavBar;
