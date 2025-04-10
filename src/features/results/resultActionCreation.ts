import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import {UNZIP} from '../../Variables';
import {NiiFile, Volume} from "./resultsSlice";
import {Job, sampleJob} from "../jobs/jobsSlice";




type GetROIPayload = {
    accessToken: string;
    pipeline: string;
  };
  
  export const getPipelineROI = createAsyncThunk(
    'GetROI',
    async ({ accessToken, pipeline }: GetROIPayload) => {
      const response = await fetch(
        `${import.meta.env.VITE_PIPELINE_ENDPOINT}/getroi?pipeline_id=${pipeline}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch ROI');
      }
  
      const data = await response.json();
      return { rois: data.rois, pipeline_id: pipeline };
    }
  );

export function niiToVolume(nii:NiiFile){
    return {
        //URL is for NiiVue blob loading
        url: nii.link,
        //name is for NiiVue name replacer (needs proper extension like .nii)
        name: (nii.filename.split('/').pop() as string),
        //alias is for user selection in toolbar
        alias: nii.name
    };
}

export const loadResult = createAsyncThunk('LoadResult', async ({accessToken,job}:{accessToken:string,job:Job})=>{
    if(job.pipeline_id==sampleJob.pipeline_id){
        return sampleResult;
    }
    const volumes:Volume[] = [];
    const file = job.files[0];
    // console.log(file);
    const result = (await axios.post(UNZIP, JSON.parse(file.location),{
        headers: {
            Authorization:`Bearer ${accessToken}`
        }
    })).data;
    // console.log(result);

    
     

    const niis = <NiiFile[]> result.data;
    // console.log(niis);
    niis.forEach((value)=>{
        // console.log(value);
        volumes.push({
            //URL is for NiiVue blob loading
            url: value.link,
            //name is for NiiVue name replacer (needs proper extension like .nii)
            name: (value.filename.split('/').pop() as string),
            //alias is for user selection in toolbar
            alias: value.name
        });
    });
    return {pipelineID:job.pipeline_id, job:job,volumes,niis,result};
        // Set pipeline ID
},{
        // Adding extra information to the meta field
        
        getPendingMeta: ({ arg, requestId }) => {
            // console.log('Pending Meta:');
            return {
                jobId: arg.job.id, // 'arg' is your original payload
                requestId
            };
        }
});
// export const uploadROI = createAsyncThunk('PostROI', async(accessToken:string, roiFile: File)=>{
//     const config = {
//         headers: {
//             Authorization: `Bearer ${accessToken}`,
//         },
//     };
//     const response = await axios.post(ROI_UPLOAD,{
//
//     })
// });

// For local testing purposes:
const sampleResult = {
    job: sampleJob,
    pipeline_id: '###',
    volumes: [
        {
            name: 'Brain.nii',
            url: './mni.nii',
            alias: 'Brain'
        },
        {
            name: 'Hippocampus.nii',
            url: './hippo.nii',
            alias: 'Hippocampus'
        }
    ],
    niis: [
        {
            filename: 'Brain.nii',
            link: './mni.nii',
            name: 'Brain',
            dim: 3,
            type: 'output',
            id: 1
        },
        {
            filename: 'Hippocampus.nii',
            link: './hippo.nii',
            name: 'Hippocampus',
            dim: 3,
            type: 'output',
            id: 2
        }
    ],
    result: {
        headers: {
            options: {
                id: 1,
                name: 'Sample Task'
            },
            log: 'Sample log'
        },
        info: {
            slices: []
        }
    }
};