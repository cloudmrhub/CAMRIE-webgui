// src/store/authActions.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface SigninDataType {
  email: string;
  password: string;
}

const API_URL = import.meta.env.VITE_API_URL;
const SIGNIN = `${API_URL}/login`;
const PROFILE = `${API_URL}/profile`;

export const getAccessToken = createAsyncThunk(
  'auth/getAccessToken',
  async (signinData: SigninDataType, thunkAPI) => {
    try {
      const response = await axios.post(SIGNIN, signinData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'cmrhv1',
          'From': 'e@e.it',
          'Accept': '*/*',
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br'
        },
      });

      const data = response.data;

      if (data.access_token) {
        console.log('Access Token:', data.access_token);
        thunkAPI.dispatch(getProfile(data.access_token));
      }

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return thunkAPI.rejectWithValue('Invalid email or password');
      }
      return thunkAPI.rejectWithValue('An error occurred');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (accessToken: string) => {
    try {
      const response = await axios.get(PROFILE, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }
);