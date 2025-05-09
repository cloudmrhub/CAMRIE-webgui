import CmrTable from "./CmrTable/CmrTable";
import { CSSProperties, useState } from "react";
import { Button, Tooltip, IconButton } from "@mui/material";
import CMRUpload, { LambdaFile } from "./Cmr-components/upload/Upload";
import { getFileExtension } from "../common/utilities";
import { is_safe_twix } from "../common/utilities/file-transformation/anonymize";
import { DATAUPLODAAPI, ROI_UPLOAD } from "../Variables";
import { AxiosRequestConfig } from "axios";
import { useAppDispatch, useAppSelector } from "../features/hooks";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import axios from "axios";
import Box from "@mui/material/Box";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Confirmation from "./Cmr-components/dialogue/Confirmation.tsx";
import { getPipelineROI } from "../features/results/resultActionCreation.ts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faObjectGroup, faObjectUngroup, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';


export const ROITable = (props: {
    pipelineID: string,
    rois: any[],
    resampleImage: () => void,
    zipAndSendROI: (url: string, filename: string, blob: Blob) => Promise<void>,
    unpackROI: (url: string) => Promise<void>,
    setLabelAlias: (label: number | string, alias: string) => void,
    style?: CSSProperties, nv: any
}) => {
    const [uploadKey] = useState(1);
    const { token: accessToken = '' } = useAppSelector((state) => state.auth) || {};
    const pipeline = useAppSelector((state) => state.result.activeJob?.pipeline_id);
    const [selectedData, setSelectedData] = useState<GridRowSelectionModel>([]);
    const dispatch = useAppDispatch();

    const UploadHeaders: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
    };

    const createPayload = async (file: File, fileAlias: string) => {
        const formData = new FormData();
        if (file) {
            const lambdaFile: LambdaFile = {
                "filename": fileAlias,
                "filetype": file.type,
                "filesize": `${file.size}`,
                "filemd5": '',
                "file": file
            };
            formData.append("lambdaFile", JSON.stringify(lambdaFile));
            formData.append("file", file);
            const fileExtension = getFileExtension(file.name);

            if (fileExtension === 'dat') {
                const safe = await is_safe_twix(file);
                if (!safe) {
                    alert('This file contains PIH data. Please anonymize the file before uploading');
                    return undefined;
                }
            }
            return { destination: DATAUPLODAAPI, lambdaFile: lambdaFile, file: file, config: UploadHeaders };
        }
    };

    const roiColumns = [
        {
            headerName: 'ROI Label',
            field: 'alias',
            flex: 1,
            editable: true,
            valueSetter: (params: { value: any; row: any }) => {

                const newAlias = params.value;
                if (newAlias !== params.row.alias) {
                    props.setLabelAlias(params.row.label, newAlias);
                }
                return { ...params.row, alias: newAlias };
            }
        },
        {
            headerName: 'Color',
            field: 'color',
            flex: 0.5,
            sortable: false,
            renderHeader: (params: any) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {params.colDef.headerName}
                </Box>
            ),
            renderCell: (params: { row: any }) => (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '14pt', height: '14pt',
                        borderRadius: '3pt',
                        background: `${params.row.color}`
                    }} />
                </Box>
            )
        },
        {
            headerName: 'Mean',
            field: 'mu',
            flex: 1,
            renderCell: (params: { row: any }) => <div>{params.row.mu.toFixed(3)}</div>
        },
        {
            headerName: 'SD',
            field: 'std',
            flex: 1,
            renderCell: (params: { row: any }) => <div>{params.row.std.toFixed(3)}</div>
        },
        {
            headerName: 'Visibility',
            field: 'visibility',
            flex: 1,
            sortable: false,
            renderHeader: (params: any) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {params.colDef.headerName}
                </Box>
            ),
            renderCell: (params: { row: any }) => (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <IconButton onClick={(event) => {
                        props.nv.setLabelVisibility(Number(params.row.label), !props.nv.getLabelVisibility(Number(params.row.label)));
                        props.resampleImage();
                        props.nv.drawScene();
                        event.stopPropagation();
                    }}>
                        {params.row.visibility ? <VisibilityIcon sx={{ color: '#aaa' }} /> : <VisibilityOffIcon sx={{ color: '#aaa' }} />}
                    </IconButton>
                </Box>
            )
        },
        {
            headerName: 'Voxel Count',
            field: 'count',
            flex: 1.5
        },
    ];

    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const warnEmptySelection = (message: string) => {
        setWarningMessage(message);
        setWarningVisible(true);
    };

    return (
        <Box style={props.style}>
            <CmrTable
                hideFooter
                getRowId={(row) => row.label}
                sx={{
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    marginBottom: 0,
                    paddingBottom: 0,
                }}
                dataSource={props.rois}
                columns={roiColumns}
                columnHeaderHeight={40}
                rowSelectionModel={selectedData}
                onRowSelectionModelChange={(model) => setSelectedData(model)}
            />

            {/* Group/Ungroup */}
            {/* <div className="row mt-2">
                <div className="col-6">
                    <Button variant="contained" fullWidth onClick={() => {
                        props.nv.groupLabelsInto(selectedData.map(value => Number(value)));
                        props.nv.drawScene();
                        props.resampleImage();
                    }}>Group</Button>
                </div>
                <div className="col-6">
                    <Button variant="contained" fullWidth onClick={() => {
                        props.nv.ungroup();
                        props.nv.drawScene();
                        props.resampleImage();
                    }}>Ungroup</Button>
                </div>
            </div> */}

            {/* Download/Delete/Upload */}
            {/* <div className="row mt-2">
                <div className="col-4">
                    <Button variant="contained" fullWidth onClick={async () => {
                        const selectedLabels = selectedData.map(label => Number(label));
                        if (!selectedLabels.length) return warnEmptySelection("No ROI selected for download");
                        await props.nv.saveImageByLabels(`label${selectedLabels.join('')}.nii`, selectedLabels);
                    }}>Download</Button>
                </div>
                <div className="col-4">
                    <Button color="error" variant="contained" fullWidth onClick={() => {
                        props.nv.deleteDrawingByLabel(selectedData.map(label => Number(label)));
                        props.resampleImage();
                        props.nv.drawScene();
                    }}>Delete</Button>
                </div>
                <div className="col-4">
                    <CMRUpload
                        changeNameAfterUpload={false}
                        color="info"
                        key={uploadKey}
                        fullWidth
                        onUploaded={() => { }} // ✅ Fix here
                        uploadHandler={async (file) => {
                            const config = { headers: { Authorization: `Bearer ${accessToken}` } };
                            const response = await axios.post(ROI_UPLOAD, {
                                filename: file.name,
                                pipeline_id: props.pipelineID,
                                type: "image",
                                contentType: "application/octet-stream"
                            }, config);
                            await props.zipAndSendROI(response.data.upload_url, file.name, file);
                            await props.unpackROI(response.data.access_url);

                            if (accessToken && pipeline) {
                                dispatch(getPipelineROI({ accessToken, pipeline }));
                            }

                            return 200;
                        }}
                        createPayload={createPayload}
                        maxCount={1}
                    />

                </div>
            </div> */}

            {/*Toolbar: Group, Ungroup, Download, Delete, Upload */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mt: 0,
                    px: 2,
                    py: 1,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                }}
            >
                <Tooltip title="Group">
                    <IconButton onClick={() => {
                        props.nv.groupLabelsInto(selectedData.map(value => Number(value)));
                        props.nv.drawScene();
                        props.resampleImage();
                    }}>
                        <FontAwesomeIcon icon={faObjectGroup} style={{ fontSize: '16px' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Ungroup">
                    <IconButton onClick={() => {
                        props.nv.ungroup();
                        props.nv.drawScene();
                        props.resampleImage();
                    }}>
                        <FontAwesomeIcon icon={faObjectUngroup} style={{ fontSize: '16px' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Download">
                    <IconButton onClick={async () => {
                        const selectedLabels = selectedData.map(label => Number(label));
                        if (!selectedLabels.length) return warnEmptySelection("No ROI selected for download");
                        await props.nv.saveImageByLabels(`label${selectedLabels.join('')}.nii`, selectedLabels);
                    }}>
                        <FontAwesomeIcon icon={faDownload} style={{ fontSize: '16px' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Delete">
                    <IconButton onClick={() => {
                        props.nv.deleteDrawingByLabel(selectedData.map(label => Number(label)));
                        props.resampleImage();
                        props.nv.drawScene();
                    }}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '16px' }} />
                    </IconButton>
                </Tooltip>

                {/* Keep Upload Button the Same, Embedded in Toolbar */}
                <CMRUpload
                    changeNameAfterUpload={false}
                    color="info"
                    key={uploadKey}
                    onUploaded={() => { }}
                    // uploadHandler={async (file) => {
                    //     const config = { headers: { Authorization: `Bearer ${accessToken}` } };
                    //     const response = await axios.post(ROI_UPLOAD, {
                    //         filename: file.name,
                    //         pipeline_id: props.pipelineID,
                    //         type: "image",
                    //         contentType: "application/octet-stream"
                    //     }, config);
                    //     await props.zipAndSendROI(response.data.upload_url, file.name, file);
                    //     await props.unpackROI(response.data.access_url);
                    //     if (accessToken && pipeline) {
                    //         dispatch(getPipelineROI({ accessToken, pipeline }));
                    //     }
                    //     return 200;
                    // }}
                    uploadHandler={async (file) => {
                        const config = {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            }
                        };

                        const filename = file.name;

                        // 1. POST metadata to get signed upload URL
                        const response = await axios.post(ROI_UPLOAD, {
                            filename: filename,
                            pipeline_id: props.pipelineID,
                            type: "image",
                            contentType: "application/octet-stream"
                        }, config);

                        // 2. Upload the actual file to the signed URL
                        await props.zipAndSendROI(response.data.upload_url, filename, file);

                        // 3. Trigger backend to unpack ROI and return access URL
                        await props.unpackROI(response.data.access_url);

                        // 4. Refresh Redux state with updated ROIs
                        if (accessToken && pipeline) {
                            dispatch(getPipelineROI({ accessToken, pipeline }));
                        }

                        return 200; // Let CMRUpload know it succeeded
                    }}
                    createPayload={createPayload}
                    maxCount={1}
                />
            </Box>

            <Confirmation
                name="Warning"
                message={warningMessage}
                color="error"
                width={400}
                open={warningVisible}
                setOpen={setWarningVisible}
                confirmText="OK"
            />
        </Box>
    );
};
