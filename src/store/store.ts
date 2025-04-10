import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import jobReducer from './jobSlice'; // this might be replaced
import dataReducer from '../features/data/dataSlice';
import jobsReducer from '../features/jobs/jobsSlice';
import resultReducer from '../features/rois/resultSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
    jobs: jobsReducer,
    job: jobReducer,
    result: resultReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
