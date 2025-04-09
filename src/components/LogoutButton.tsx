// src/components/LogoutButton.tsx
import { Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

export default function LogoutButton() {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    // Optional: window.location.href = '/' or use navigate() if using React Router
  };

  return (
    <Button variant="outlined" sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'transparent' } }} onClick={handleLogout}>
      Logout
    </Button>
  );
}
