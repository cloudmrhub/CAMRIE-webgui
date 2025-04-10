import { createSlice } from '@reduxjs/toolkit';
import { getUpstreamJobs } from './jobActionCreation';

const initialState = {
  jobs: [],
};

export const sampleJob = {id:0,
  alias: 'sample0',
  status: 'completed',
  createdAt: '08-21-2023',
  updatedAt: '08-21-2023',
  pipeline_id:'###',
  setup: {
      version: 'v0',
      alias: 'sample0',
      output:{
          coilsensitivity: false,
          gfactor: false,
          matlab: true
      },
      task: {}
  },
  files: [
      {
          id: 0,
          fileName: 'Brain',
          link: './mni.nii',
          size: '',
          status: '',
          createdAt: '',
          updatedAt: '',
          //One of local or s3
          database: 's3',
          location: ''
      },{
          id: 1,
          fileName: 'Hippocampus',
          link: './hippo.nii',
          size: '',
          status: '',
          createdAt: '',
          updatedAt: '',
          //One of local or s3
          database: 's3',
          location: ''
      }]
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
      state.jobs = action.payload.jobs;
    });
  },
});

export default jobsSlice.reducer;
