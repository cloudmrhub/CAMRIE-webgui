// src/store/jobSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface JobState {
  fieldId: string | null;
  sequenceId: string | null;
}

const initialState: JobState = {
  fieldId: null,
  sequenceId: null,
};

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    setFieldId: (state, action: PayloadAction<string>) => {
      state.fieldId = action.payload;
    },
    setSequenceId: (state, action: PayloadAction<string>) => {
      state.sequenceId = action.payload;
    },
  },
});

export const { setFieldId, setSequenceId } = jobSlice.actions;

export default jobSlice.reducer;

