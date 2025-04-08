// src/store/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { getAccessToken, getProfile } from './authActions';

interface AuthState {
  token: string | null;
  profile: any;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  profile: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAccessToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccessToken.fulfilled, (state, action) => {
        state.token = action.payload?.access_token || null;
        state.loading = false;
      })
      .addCase(getAccessToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
