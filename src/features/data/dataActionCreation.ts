import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { DATAAPI } from '../../Variables';

export const getUploadedData = createAsyncThunk(
  'data/getUploadedData',
  async (accessToken: string) => {

    const response = await axios.get(DATAAPI, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        Authorization: `Bearer ${accessToken}`,
      },
    });
 
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array but got HTML or invalid data');
    }

    return response.data.map((item: any) => ({
      id: item.id.toString(),
      fileName: item.filename,
      link: item.link,
      status: item.status,
      createdAt: item.created_at,
    }));
  }
);




  

export const deleteUploadedData = createAsyncThunk(
  'data/deleteUploadedData',
  async ({ token, fileId }: { token: string; fileId: string }) => {
    await axios.delete(`${DATAAPI}/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return fileId;
  }
);
