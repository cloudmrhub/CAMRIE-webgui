// src/components/Login.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, TextField, Button, Typography } from '@mui/material';
import { AppDispatch, RootState } from '../store/store';
import { getAccessToken } from '../store/authActions';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { token, error, loading } = useSelector((state: RootState) => state.auth);

  const handleLogin = () => {
    dispatch(getAccessToken({ email, password }));
  };

  useEffect(() => {
    if (token) {
      onLogin(); // callback to App.tsx to show tabs
    }
  }, [token]);

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" fullWidth type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button variant="contained" fullWidth onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      {error && <Typography color="error" mt={2}>{error}</Typography>}
    </Box>
  );
}
