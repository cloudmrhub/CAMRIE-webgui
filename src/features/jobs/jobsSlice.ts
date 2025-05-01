import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getUpstreamJobs } from './jobActionCreation';

// ✅ Export Job interface for type usage elsewhere
export interface Job {
  id: number;
  alias: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pipeline_id: string;
  setup: {
    version: string;
    alias: string;
    output: {
      coilsensitivity: boolean;
      gfactor: boolean;
      matlab: boolean;
    };
    task: Record<string, any>;
  };
  files: {
    id: number;
    fileName: string;
    link: string;
    size: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    database: string;
    location: string;
  }[];
}

// ✅ Provide sampleJob with correct typing
export const sampleJob: Job = {
  id: 0,
  alias: 'sample0',
  status: 'completed',
  createdAt: '08-21-2023',
  updatedAt: '08-21-2023',
  pipeline_id: '###',
  setup: {
    version: 'v0',
    alias: 'sample0',
    output: {
      coilsensitivity: false,
      gfactor: false,
      matlab: true,
    },
    task: {},
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
      database: 's3',
      location: '',
    },
    {
      id: 1,
      fileName: 'Hippocampus',
      link: './hippo.nii',
      size: '',
      status: '',
      createdAt: '',
      updatedAt: '',
      database: 's3',
      location: '',
    },
  ],
};

interface JobsState {
  jobs: Job[];
}

const initialState: JobsState = {
  jobs: [],
};

export const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    deleteJob: (state, action: PayloadAction<{ index: number }>) => {
      state.jobs.splice(action.payload.index, 1);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getUpstreamJobs.fulfilled, (state, action: PayloadAction<{ jobs: Job[] }>) => {
      state.jobs = action.payload.jobs;
    });
  },
});

export default jobsSlice.reducer;
