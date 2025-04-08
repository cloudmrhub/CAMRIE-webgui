import { createSlice } from '@reduxjs/toolkit';
import { getUpstreamJobs, deleteUpstreamJob } from './jobActionCreation';

const initialState = {
  jobs: [],
};

export const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    deleteJob: (state, action) => {
      state.jobs.splice(action.payload.index, 1);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getUpstreamJobs.fulfilled, (state, action) => {
      state.jobs = action.payload.jobs; // 👈 Important fix
    });
  },
});

export default jobsSlice.reducer;
