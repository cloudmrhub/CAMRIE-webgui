import React, { Fragment, useEffect, useState, useRef } from "react";
import "./Setup.scss";
import { CmrCollapse, CmrPanel, CmrConfirmation } from "cloudmr-ux";
import {
  getUploadedData,
  uploadData,
} from "cloudmr-ux/core/features/data/dataActionCreation";
import { useAppDispatch, useAppSelector } from "../../features/hooks";
import {
  getFiles,
  setupGetters,
  setupSetters,
} from "../../features/setup/setupSlice";
import { CMRSelectUpload } from "cloudmr-ux";
import { CmrLabel } from "cloudmr-ux";
import { Col, Row } from "antd";
import moment from "moment";

import {
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Checkbox
} from "@mui/material";
import { CmrCheckbox } from "cloudmr-ux";
import {
  DataGrid,
  GridCellEditStopParams,
  GridColDef,
  GridRowId,
  GridRowsProp,
} from "@mui/x-data-grid";
import { CmrButton } from "cloudmr-ux";
import { CmrInputNumber } from "cloudmr-ux";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { UploadedFile } from "cloudmr-ux/core/features/data/dataSlice";
import { formatBytes } from "cloudmr-ux/core/common/utilities/SystemUtilities";
import { jobActions } from "cloudmr-ux/core/features/jobs/jobsSlice";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import GetAppIcon from "@mui/icons-material/GetApp";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import { store } from "../../features/store";
import { submitJobs } from "cloudmr-ux/core/features/setup/setupActionCreation";
import { downloadStringAsFile } from "cloudmr-ux/core/common/utilities/DownloadFromText";
import { uploadHandlerFactory } from "cloudmr-ux/core/common/utilities/SystemUtilities";

const Setup = () => {
  const [openModelPanel, setOpenModelPanel] = useState<Array<string | number>>([0]); // open by default
  const [openPulsePanel, setOpenPulsePanel] = useState<Array<string | number>>([]); // closed by default
  const [openFieldofViewPanel, setOpenFieldofViewPanel] = useState<Array<string | number>>([]); // closed by default

  // temporarily use local data for models
  const modelOptions = [
    {
      id: 'cloudMR_overlap-ismrm25.zip',
      name: '16-Ch 3T Head Surface Coil',
      b0: '3T',
      channels: 16,
      coil: '16-Ch 3T Head Surface Coil',
      resolution: '2 mm isotropic',
      emSimulator: 'MARIE_version_Hybrid_VSIE',
      numOfTissues: '22',
      numOfElements: '16',
      objectName: 'Duke_2mm',
      frequency: '2.1714514044179997E+9',
      description: 'Overlap 16 Channels Coil for 3T MRI scanner with Duke Phantom',
      image: "/models/headSurface.png"
    },
    {
      id: 'cloudMR_birdcagecoil-ismrm25.zip',
      name: '3T Head Birdcage Coil',
      b0: '3T',
      channels: 1,
      coil: '3T Head Birdcage Coil',
      resolution: '2 mm isotropic',
      emSimulator: 'MARIE_version_Hybrid_VSIE',
      numOfTissues: '22',
      numOfElements: '1',
      objectName: 'Duke_2mm',
      frequency: '2.1714514044179997E+9',
      description: 'Birdcage single Coil for 3T MRI scanner with Duke Phantom',
      image: "/models/birdcageCoil.png"
    },
    {
      id: 'cloudMR_triangularcoil-ismrm25.zip',
      name: '8-Ch 7T Head Triangular Coil',
      b0: '7T',
      channels: 1,
      coil: '8-Ch 7T Head Triangular Coil',
      resolution: '2 mm isotropic',
      emSimulator: 'MARIE_version_Hybrid_VSIE',
      numOfTissues: '23',
      numOfElements: '1',
      objectName: 'Duke_2mm',
      frequency: '2.34176131849E+9',
      description: 'Triangular single Coil for 3T MRI scanner with Duke Phantom',
      image: "/models/triangularCoil.png"
    },
  ];

  const uploadedFiles: UploadedFile[] = modelOptions.map((opt, index) => ({
    id: index + 1,          // numeric ID for SelectUpload
    fileName: opt.name,    // what shows in dropdown
    link: opt.id,          // store real ID here
    location: 'local',
    database: 'local',
    size: '—',
    status: 'local',
    createdAt: '',
    updatedAt: '',
  }));

  const [selectedModel, setSelectedModel] = useState<
    (typeof modelOptions)[number] | null
  >(null);

  const handleModelSelected = (file?: UploadedFile) => {
    if (!file) {
      setSelectedModel(null);
      return;
    }

    const match = modelOptions.find(
      (opt) => opt.id === file.link
    );

    setSelectedModel(match ?? null);
  };

  const clearSelectedModel = () => {
    setSelectedModel(null);
  };
  // end

  // sequence local data
  const sequenceOptions = [
    {
      id: 'PD-Weighted_Spin_Echo.mtrk',
      name: 'PD Weighted Spin Echo [type: mtrk]',
      description: 'ISMRM25',
      tr: '4000ms',
      te: '10ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'PD-Weighted_Spin_Echo.seq',
      name: 'PD Weighted Spin Echo [type: pulseq]',
      description: 'ISMRM25',
      tr: '4000ms',
      te: '10ms',
      fa: [90, 180],
      type: 'pulseq'
    },
    {
      id: 'T1-Weighted_Spin_Echo.mtrk',
      name: 'T1 Weighted Spin Echo [type: mtrk]',
      description: 'ISMRM25',
      tr: '600ms',
      te: '10ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'T1-Weighted_Spin_Echo.seq',
      name: 'T1 Weighted Spin Echo [type: pulseq]',
      description: 'ISMRM25',
      tr: '600ms',
      te: '10ms',
      fa: [90, 180],
      type: 'pulseq'
    },
    {
      id: 'T1-Weighted_Spoiled_GRE.mtrk',
      name: 'T1 Weighted Spoiled GRE [type: mtrk]',
      description: 'ISMRM25',
      tr: '40ms',
      te: '10ms',
      fa: [15],
      type: 'mtrk'
    },
    {
      id: 'T1-Weighted_Spoiled_GRE.seq',
      name: 'T1 Weighted Spoiled GRE [type: pulseq]',
      description: 'ISMRM25',
      tr: '40ms',
      te: '10ms',
      fa: [15],
      type: 'pulseq'
    },
    {
      id: 'T2-Weighted_Spin_Echo.mtrk',
      name: 'T2 Weighted Spin Echo [type: mtrk]',
      description: 'ISMRM25',
      tr: '4000ms',
      te: '80ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'T2-Weighted_Spin_Echo.seq',
      name: 'T2 Weighted Spin Echo [type: pulseq]',
      description: 'ISMRM25',
      tr: '4000ms',
      te: '80ms',
      fa: [90, 180],
      type: 'pulseq'
    },
  ];

  const uploadedFiles2: UploadedFile[] = sequenceOptions.map((opt, index) => ({
    id: index + 1,          // numeric ID for SelectUpload
    fileName: opt.name,    // what shows in dropdown
    link: opt.id,          // store real ID here
    location: 'local',
    database: 'local',
    size: '—',
    status: 'local',
    createdAt: '',
    updatedAt: '',
  }));

  const [selectedSequence, setSelectedSequence] = useState<
    typeof sequenceOptions[number] | null
  >(null);

  const handleSequenceSelected = (file?: UploadedFile) => {
    if (!file) {
      setSelectedSequence(null);
      return;
    }

    const match = sequenceOptions.find(
      (opt) => opt.id === file.link
    );

    setSelectedSequence(match ?? null);
  };

  const clearSelectedSequence = () => {
    setSelectedSequence(null);
  };

  //end

  // placeholder remove later
  const noopUploadHandler = async (
    file: File,
    fileAlias: string,
    fileDatabase: string,
    onProgress?: (progress: number) => void,
    onUploaded?: (res: any, file: File) => void
  ): Promise<number> => {
    // optional: make progress look “done”
    onProgress?.(100);

    // no real upload — just return a fake numeric id
    return 0;
  };


  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? "#1578A1" : base.borderColor,
      boxShadow: state.isFocused ? `0 0 0 1px #1578A1` : base.boxShadow,
      "&:hover": {
        borderColor: "#1578A1",
      },
      fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
      fontWeight: 400,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor:
        state.isFocused || state.isSelected ? "#E3F1F6" : "white",
      color: "#000",
      fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
      fontWeight: 400,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 2000, // needed for portal target to body
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 9999, // ensures it renders over dialogs
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#1578A1",
      fontWeight: 400,
      fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
    }),
  };

  const pulsePanelRef = useRef<HTMLDivElement | null>(null);

  const handleProceedToPulseSequence = () => {
    // open Pulse Sequence panel (matches your other panel key usage)
    setOpenPulsePanel([0]);

    // optional: scroll into view after it opens
    window.setTimeout(() => {
      pulsePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  //  Adding sequences to the protocol
  const [protocolSequences, setProtocolSequences] = useState<
    typeof sequenceOptions[number][]
  >([]);

  const handleAddSequence = () => {
    if (!selectedSequence) return;

    setProtocolSequences((prev) => {
      const alreadyAdded = prev.some((s) => s.id === selectedSequence.id);
      if (alreadyAdded) return prev;
      return [...prev, selectedSequence];
    });

    // default to unchecked (false)
    setProtocolChecked((prev) => ({
      ...prev,
      [selectedSequence.id]: prev[selectedSequence.id] ?? false,
    }));
  };


  // checkbox for sequence in protocol
  const [protocolChecked, setProtocolChecked] = useState<Record<string, boolean>>({});

  const toggleProtocolChecked = (id: string) => {
    setProtocolChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRemoveSequenceFromProtocol = (id: string) => {
    setProtocolSequences((prev) => prev.filter((seq) => seq.id !== id));

    // clean up checkbox state
    setProtocolChecked((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleDeleteCheckedSequences = () => {
    const idsToDelete = Object.entries(protocolChecked)
      .filter(([_, checked]) => checked)
      .map(([id]) => id);

    if (idsToDelete.length === 0) return;

    // Remove from protocol list
    setProtocolSequences((prev) => prev.filter((seq) => !idsToDelete.includes(seq.id)));

    // Clean up checkbox state
    setProtocolChecked((prev) => {
      const next = { ...prev };
      idsToDelete.forEach((id) => delete next[id]);
      return next;
    });
  };


  return (
    <Box
      className="page-content"
      sx={{
        minHeight: "100vh",
        boxSizing: "border-box",
        pb: "72px", // reserve space for footer overlap
      }}
    >
      {/* Model */}
      <CmrCollapse
        accordion={false}
        expandIconPosition="right"
        activeKey={openModelPanel}
        onChange={(keys: any) => setOpenModelPanel(keys)}
      >
        <CmrPanel key="1" header="Model" className="mb-2">
          <Row>
            <Col>
              <Box display="flex" flexDirection="column">
                {/* Inline row for label, upload, clear, checkbox */}
                <Box display="flex" alignItems="center" gap={1}>
                  <CmrLabel style={{ marginRight: "10px" }}>
                    Model:
                  </CmrLabel>

                  <CMRSelectUpload
                    fileSelection={uploadedFiles}
                    onSelected={handleModelSelected}
                    onUploaded={() => { }}
                    chosenFile={selectedModel?.name}
                    maxCount={1}
                    uploadHandler={noopUploadHandler}
                    buttonText="Choose"
                  />

                  {/* Clear Button */}
                  {selectedModel && (
                    <Tooltip title="Clear Selected Model">
                      <IconButton size="small" onClick={clearSelectedModel}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Col>
          </Row>

          {selectedModel && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {/* LEFT CARD: Image */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={selectedModel.image}
                      alt={selectedModel.name}
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 265,
                        objectFit: "contain",
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* RIGHT CARD: Description / Metadata */}
              <Grid item xs={12} md={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontSize: "16px" }}>
                      {selectedModel.name}
                    </Typography>

                    <Grid container>
                      {/* Column 1 */}
                      <Grid item xs={12} sm={12}>
                        <Typography>
                          <strong>Object Name:</strong> {selectedModel.objectName}
                        </Typography>
                        <Typography>
                          <strong>B0:</strong> {selectedModel.b0}
                        </Typography>
                        <Typography>
                          <strong>Frequency:</strong> {selectedModel.frequency}
                        </Typography>
                        <Typography>
                          <strong>Resolution:</strong> {selectedModel.resolution}
                        </Typography>
                        <Typography>
                          <strong>Number of Tissues:</strong> {selectedModel.numOfTissues}
                        </Typography>
                        <Typography>
                          <strong>Coil:</strong> {selectedModel.coil}
                        </Typography>
                        <Typography>
                          <strong>Channels:</strong> {selectedModel.channels}
                        </Typography>
                        <Typography>
                          <strong>Number of Elements:</strong> {selectedModel.numOfElements}
                        </Typography>
                        <Typography>
                          <strong>EM&nbsp;Simulator:</strong>&nbsp;{selectedModel.emSimulator}
                        </Typography>
                      </Grid>

                      {/* Column 2 */}
                      {/* <Grid item xs={12} sm={7}>
                        <Typography>
                          <strong>Coil:</strong> {selectedModel.coil}
                        </Typography>
                        <Typography>
                          <strong>Channels:</strong> {selectedModel.channels}
                        </Typography>
                        <Typography>
                          <strong>Number of Elements:</strong> {selectedModel.numOfElements}
                        </Typography>
                        <Typography>
                          <strong>EM&nbsp;Simulator:</strong>&nbsp;{selectedModel.emSimulator}
                        </Typography>
                      </Grid> */}
                    </Grid>

                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* a simple "Proceed" button that opens the pulse sequence panel*/}
          {selectedModel && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <CmrButton
                variant="contained"
                onClick={handleProceedToPulseSequence}
              >
                Proceed
              </CmrButton>
            </Box>
          )}
        </CmrPanel>
      </CmrCollapse>

      {/* Pulse Sequence */}
      <CmrCollapse
        accordion={false}
        expandIconPosition="right"
        activeKey={openPulsePanel}
        onChange={(keys: any) => setOpenPulsePanel(keys)}
      >
        <CmrPanel header="Pulse Sequence" className="mb-2">
          <Row>
            <Col>
              <Typography variant="h6" sx={{ fontSize: "16px", mb: 2, }}> Pulse Sequence Selection</Typography>
              <Box display="flex" flexDirection="column">
                {/* Inline row for label, upload, clear, checkbox */}
                <Box display="flex" alignItems="center" gap={1}>

                  <CmrLabel style={{ marginRight: "10px" }}>
                    Sequence:
                  </CmrLabel>

                  <CMRSelectUpload
                    fileSelection={uploadedFiles2}
                    onSelected={handleSequenceSelected}
                    onUploaded={() => { }}
                    chosenFile={selectedSequence?.name}
                    maxCount={1}
                    uploadHandler={noopUploadHandler}
                    buttonText="Choose"
                  />

                  {/* Clear Button */}
                  {selectedSequence && (
                    <Tooltip title="Clear Selected Sequence">
                      <IconButton size="small" onClick={clearSelectedSequence}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                </Box>
              </Box>

              {selectedSequence && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Box textAlign="left" height="100%">
                      <Typography><strong>ID:</strong>&nbsp;{selectedSequence.id}</Typography>
                      <Typography><strong>Description:</strong>&nbsp;{selectedSequence.description}</Typography>
                      <Typography><strong>TR:</strong>&nbsp;{selectedSequence.tr}</Typography>
                      <Typography><strong>TE:</strong>&nbsp;{selectedSequence.te}</Typography>
                      <Typography><strong>FA:</strong>&nbsp;{selectedSequence.fa}</Typography>
                      <Typography><strong>ACC:</strong>&nbsp;1x1</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* "Add Sequence" button (display only when selectedSequence is not null) */}
              {selectedSequence && (
                <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", pt: 2 }}>
                  <CmrButton variant="contained" onClick={handleAddSequence}>
                    Add Sequence
                  </CmrButton>
                </Box>
              )}
            </Col>

            <Col
              xs="auto"
              style={{
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <Divider orientation="vertical" flexItem sx={{
                mx: 4, borderColor: "rgba(0, 0, 0, 0.35)",
                borderRightWidth: 1.5,
              }} />
            </Col>

            <Col>
              <Typography variant="h6" sx={{ fontSize: "16px", mb: 2, }}> Protocol </Typography>

              {protocolSequences.length === 0 ? (
                <Typography color="text.secondary">
                  No pulse sequence added
                </Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {
                    protocolSequences.map((seq) => (
                      <Box key={seq.id} display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          size="small"
                          checked={!!protocolChecked[seq.id]}
                          onChange={() => toggleProtocolChecked(seq.id)}
                          sx={{
                            p: 0,
                            mr: 0.5,
                            "&.Mui-checked": {
                              color: "#1578A1 !important",
                            },
                          }}
                        />
                        <Typography>{seq.name}</Typography>

                        {/* Right: trash icon */}
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSequenceFromProtocol(seq.id)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                    ))
                  }
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,          // spacing between buttons
                  mt: 2,
                  width: "100%",
                }}
              >
                <CmrButton
                  variant="contained"
                  color="error"
                  onClick={handleDeleteCheckedSequences}
                  disabled={protocolSequences.length === 0}
                  sx={{ flex: 1, width: "100%" }}
                >
                  Delete
                </CmrButton>

                <CmrButton
                  variant="contained"
                  onClick={() => { }}
                  sx={{ flex: 1, width: "100%"}}
                  disabled={protocolSequences.length === 0}
                >
                  Save
                </CmrButton>

                <CmrButton
                  variant="contained"
                  onClick={() => { }}
                  sx={{ flex: 1, width: "100%", }}
                  disabled={protocolSequences.length === 0}
                >
                  Queue
                </CmrButton>
              </Box>


            </Col>
          </Row>
        </CmrPanel>

      </CmrCollapse>

      {/* Field of View */}
      <CmrCollapse
        accordion={false}
        expandIconPosition="right"
        activeKey={openFieldofViewPanel}
        onChange={(keys: any) => setOpenFieldofViewPanel(keys)}
      >
        <CmrPanel header="Field of View" className="mb-2">
          <Row>
            <Col>
              <Box display="flex" flexDirection="column">
                {/* Inline row for label, upload, clear, checkbox */}
                <Box display="flex" alignItems="center" gap={1}>


                </Box>
              </Box>
            </Col>
          </Row>

        </CmrPanel>

      </CmrCollapse>


    </Box>
  );
};

export default Setup;
