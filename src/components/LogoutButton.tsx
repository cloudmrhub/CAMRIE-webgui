// src/components/LogoutButton.tsx
import { Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import LogoutIcon from '@mui/icons-material/Logout';

export default function LogoutButton() {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    // Optional: window.location.href = '/' or use navigate() if using React Router
  };

  return (
    <Button variant="outlined" sx={{ borderColor: 'white', color: '#333', textTransform: 'none', '&:hover': { borderColor: 'white', backgroundColor: 'transparent' } }} onClick={handleLogout}>
      <LogoutIcon sx={{
          fontSize: '18px',
          color: 'rgba(0, 0, 0, 0.6)',
          marginRight: '12px',
        }}/> Log Out
    </Button>
  );
}