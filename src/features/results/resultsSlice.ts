import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getPipelineROI, loadResult } from './resultActionCreation';
import { Job } from "../jobs/jobsSlice";

export interface ROI {
    id: number;
    created_at: string;
    updated_at: string;
    location: string;
    link: string;
    filename: string;
    size: null | number;
    md5: null | string;
    status: string;
    database: string;
    type: string;
    pivot: {
        pipeline_id: string;
        roi_id: string;
    };
}

export interface Volume {
    name: string;
    url: string;
    alias: string;
}

export interface NiiFile {
    filename: string;
    id: number;
    dim: number;
    name: string;
    type: string;
    link: string;
}

export interface ROIState {
    rois: { [pipeline_id: string]: ROI[] };
    resultLoading: number;
    loading: boolean;
    niis: { [pipeline_id: string]: NiiFile[] };
    activeJob?: Job & {
        logs?: any;
        slices?: any;
    };
    selectedVolume: number;
    openPanel: number[];
}

const initialState: ROIState = {
    rois: {},
    niis: { '-1': [] },
    resultLoading: -1,
    loading: false,
    activeJob: undefined,
    selectedVolume: 2,
    openPanel: [0]
};

export const resultSlice = createSlice({
    name: 'job',
    initialState,
    reducers: {
        setPipelineID(state: ROIState, action: PayloadAction<Job>) {
            state.activeJob = action.payload;
        },
        selectVolume(state: ROIState, action: PayloadAction<number>) {
            state.selectedVolume = action.payload;
        },
        setOpenPanel(state: ROIState, action: PayloadAction<number[]>) {
            state.openPanel = action.payload;
        }
    },
    extraReducers: (builder) => (
        builder.addCase(getPipelineROI.pending, (state, action) => {
            console.log('action', action);
            state.loading = true;
        }),
        builder.addCase(getPipelineROI.fulfilled, (state, action) => {
            const { rois, pipeline_id }: { rois: ROI[], pipeline_id: string } = action.payload;
            state.rois[pipeline_id] = [];
            if (rois.length > 0) {
                rois.forEach((element) => {
                    if (state.rois[pipeline_id] == undefined)
                        state.rois[pipeline_id] = []
                    state.rois[pipeline_id].push(element);
                });
            }
            state.loading = false;
        }),
        builder.addCase(loadResult.pending, (state: ROIState, action) => {
            // @ts-ignore
            state.resultLoading = action.meta.jobId;
        }),
        builder.addCase(
            loadResult.fulfilled, (state: ROIState, action) => {
                const clonedJob = { ...action.payload.job } as Job & {
                    logs?: any;
                    slices?: any;
                    setup: {
                        alias: string;
                        version: string;
                        output: { coilsensitivity: boolean; gfactor: boolean; matlab: boolean; };
                        task: any;
                    }
                };

                clonedJob.setup = {
                    alias: '-',
                    version: 'v0',
                    output: { coilsensitivity: false, gfactor: false, matlab: true },
                    task: action.payload.result.headers.options
                };
                clonedJob.logs = action.payload.result.headers.log;
                clonedJob.slices = action.payload.result.info?.slices;
                console.log(clonedJob);
                state.activeJob = clonedJob;
                state.niis[state.activeJob.pipeline_id] = action.payload.niis;
                state.selectedVolume = 1;
                state.resultLoading = -1;
            }),
        builder.addCase(
            loadResult.rejected, (state: ROIState, action) => {
                console.log('Error loading result', action.error);
                state.resultLoading = -1;
            })
    ),
});

export const resultActions = resultSlice.actions;
export default resultSlice.reducer;

export interface ROI {
    id: number;
    created_at: string;
    updated_at: string;
    location: string;
    link: string;
    filename: string;
    size: null | number;
    md5: null | string;
    status: string;
    database: string;
    type: string;
    pivot: {
        pipeline_id: string;
        roi_id: string;
    };
}