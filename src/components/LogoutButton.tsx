// src/components/LogoutButton.tsx
import React from 'react';
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
    <Button variant="outlined" color="secondary" onClick={handleLogout}>
      Logout
    </Button>
  );
}
