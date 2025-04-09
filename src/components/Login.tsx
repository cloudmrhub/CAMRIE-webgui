// src/components/Login.tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, TextField, Button, Typography } from '@mui/material';
import { AppDispatch, RootState } from '../store/store';
import { getAccessToken } from '../store/authActions';
import CustomButton from '../components/CustomButton/CustomButton';

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
    <>
    <Box sx={{  
        maxWidth: 400,            
        mx: 'auto', 
        paddingTop: 'calc(20vh - 20px)'
        }}>
      {/* <Typography variant="h5" gutterBottom>Login</Typography> */}
      <div id="welcome-logo">
        <div
          style={{
            margin: 'auto',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src="/camrieLetterLogo.png"
            className="img-fluid"
            style={{ margin: 'auto', height: '70pt' }}
            alt="Logo"
          />
        </div>
      </div>
      <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" fullWidth type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
      <CustomButton
        variant="contained"
        fullWidth
        onClick={handleLogin}
        disabled={loading}
        text={loading ? 'Logging in...' : 'Login'}
        className="custom-purple-button"
      />
      {/* <Button variant="contained" fullWidth onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button> */}
      {error && <Typography color="error" mt={2}>{error}</Typography>}
    </Box>
  </>
  );
}
