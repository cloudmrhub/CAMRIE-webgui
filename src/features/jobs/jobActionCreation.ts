import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { JOBSAPI } from '../../Variables';

export const getUpstreamJobs = createAsyncThunk(
  'jobs/getUpstreamJobs',
  async (accessToken: string) => {
    const response = await axios.get(JOBSAPI, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }
);

export const deleteUpstreamJob = createAsyncThunk(
  'jobs/deleteUpstreamJob',
  async ({ token, jobId }: { token: string; jobId: string }) => {
    await axios.delete(`${JOBSAPI}/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return jobId;
  }
);
