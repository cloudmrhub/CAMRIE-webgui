import { createSlice } from '@reduxjs/toolkit';
import { getUploadedData, deleteUploadedData } from './dataActionCreation';

export interface UploadedFile {
  id: string;
  fileName: string;
  link: string;
  status: string;
  createdAt: string;
}

interface DataState {
  files: UploadedFile[];
}

const initialState: DataState = {
  files: [],
};

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUploadedData.fulfilled, (state, action) => {
      state.files = action.payload;
    });
    builder.addCase(deleteUploadedData.fulfilled, (state, action) => {
      state.files = state.files.filter(file => file.id !== action.payload);
    });
  },
});

export default dataSlice.reducer;
