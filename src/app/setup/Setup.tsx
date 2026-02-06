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
import { CMRSelectUpload, CmrInputNumber } from "cloudmr-ux";
import { CmrLabel } from "cloudmr-ux";
import { Col, Row } from "antd";
import moment from "moment";
import {
  Divider,
  Tooltip,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Grid,
  Checkbox,
  Alert,
  TextField,
  FormControl,
  MenuItem,
  Select,
  FormHelperText
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { CmrButton } from "cloudmr-ux";
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

  const getSequenceById = (id: string) =>
    sequenceOptions.find((s) => s.id === id) ?? null;

  const PROTOCOL_1_SEQUENCE_IDS = [
    "PD-Weighted_Spin_Echo.mtrk",
    "T1-Weighted_Spin_Echo.seq",
    "T1-Weighted_Spoiled_GRE.seq",
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

  // --- Edit Sequence Dialog ---
  const [editSeqOpen, setEditSeqOpen] = useState(false);

  const [editSeqDraft, setEditSeqDraft] = useState<{
    trMs: number;
    teMs: number;
  }>({ trMs: 0, teMs: 0 });

  const parseMs = (v: string) => {
    const n = Number(String(v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const formatMs = (n: number) => `${n}ms`;

  const openEditSequenceDialog = () => {
    if (!selectedSequence) return;

    // prefill draft from current values
    setEditSeqDraft({
      trMs: parseMs(selectedSequence.tr),
      teMs: parseMs(selectedSequence.te),
    });

    setEditSeqOpen(true);
  };

  const closeEditSequenceDialog = () => {
    setEditSeqOpen(false);
  };

  const saveEditSequenceDialog = () => {
    if (!selectedSequence) return;

    // If not mtrk, just close (no edits allowed anyway)
    if (selectedSequence.type !== "mtrk") {
      setEditSeqOpen(false);
      return;
    }

    // update selectedSequence locally
    const updated = {
      ...selectedSequence,
      tr: formatMs(editSeqDraft.trMs),
      te: formatMs(editSeqDraft.teMs),
    };

    setSelectedSequence(updated);

    setProtocolSequences((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, tr: updated.tr, te: updated.te } : s))
    );

    setEditSeqOpen(false);
  };
  // -- end Edit Sequence Dialog


  // --- Protocol Dropdown ---
  // --- Protocol Dropdown ---
  const [protocol, setProtocol] = useState<string | number>(""); // "" = New Protocol

  const handleChange = (event: any) => {
    const value = event.target.value;
    setProtocol(value);

    // Reset check state when switching protocols
    setProtocolChecked({});

    if (value === "") {
      // New Protocol => start empty
      setProtocolSequences([]);
      return;
    }

    if (value === 10) {
      // Protocol 1 => load predefined sequences
      const loaded = PROTOCOL_1_SEQUENCE_IDS
        .map((id) => getSequenceById(id))
        .filter((s): s is typeof sequenceOptions[number] => Boolean(s));

      setProtocolSequences(loaded);
      return;
    }

    // Protocol 2/3 (placeholder for now)
    setProtocolSequences([]);
  };

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

  // --- Save As New (DEMO only) ---
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsIdDraft, setSaveAsIdDraft] = useState("");

  const openSaveAsDialog = () => {
    if (!selectedSequence) return;

    // suggestion only
    const suggested = selectedSequence.id.replace(/(\.mtrk|\.seq)$/i, "_copy$1");
    setSaveAsIdDraft(suggested);

    setSaveAsOpen(true);

    setEditSeqOpen(false);

  };

  const closeSaveAsDialog = () => {
    setSaveAsOpen(false);
  };

  // demo: do nothing except close
  const confirmSaveAsDemo = () => {
    setSaveAsOpen(false);
    // no changes, no additions, no edits
  };



  return (
    <Grid container spacing={2} sx={{ minHeight: '100vh', alignItems: 'stretch' }}>
      <Grid item xs={12} md={5} sx={{ minHeight: { xs: 0, sm: 0, md: 1430 } }}>
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
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardHeader
                  subheader="Model Details"
                  sx={{
                    backgroundColor: "#F7F7F9",
                    borderBottom: "1px solid #E6E6EA",
                    "& .MuiCardHeader-subheader": {
                      color: "#333"
                    }
                  }}
                />
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* LEFT: Image */}
                    <Grid item xs={12} md={4}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          minHeight: 220,
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
                      </Box>
                    </Grid>

                    {/* RIGHT: Details */}
                    <Grid item xs={12} md={8}>
                      {/* <Typography variant="h6" sx={{ mb: 2, fontSize: "16px" }}>
                        {selectedModel.name}
                      </Typography> */}

                      <Typography>
                        <strong>Object Name:</strong> {selectedModel.objectName}
                      </Typography>

                      <Typography>
                        <strong>B<sub>0</sub>:</strong> {selectedModel.b0}
                      </Typography>

                      <Typography>
                        <strong>Frequency:</strong> {selectedModel.frequency} MHz
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
                        <strong>EM Simulator:</strong> {selectedModel.emSimulator}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
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
          <CmrPanel header="Pulse Sequence and Protocol" className="mb-2">
            {/* <Typography variant="h6" sx={{ fontSize: "16px", mb: 2, }}> Pulse Sequence Selection</Typography> */}
            <Box sx={{ pb: 3 }}>
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
                  <CardHeader
                    subheader="Sequence Details"
                    sx={{
                      backgroundColor: "#F7F7F9",
                      borderBottom: "1px solid #E6E6EA",
                      "& .MuiCardHeader-subheader": {
                        color: "#333"
                      }
                    }}
                    action={
                      <Tooltip title="Edit Sequence">
                        <span>
                          <IconButton
                            aria-label="edit"
                            onClick={openEditSequenceDialog}
                            disabled={!selectedSequence}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    }
                  />
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

              <Dialog
                open={editSeqOpen}
                onClose={closeEditSequenceDialog}
                fullWidth
                maxWidth="sm"
              >
                <DialogTitle sx={{ fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif" }}>
                  Edit Sequence
                </DialogTitle>

                <DialogContent dividers>
                  {!selectedSequence ? (
                    <Typography color="text.secondary">No sequence selected.</Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                      <Typography><strong>ID:</strong>&nbsp;{selectedSequence.id}</Typography>
                      <Typography><strong>Description:</strong>&nbsp;{selectedSequence.description}</Typography>

                      {/* TR */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ minWidth: 44 }}><strong>TR:</strong></Typography>

                        {selectedSequence.type === "mtrk" ? (
                          <>
                            <TextField
                              type="number"
                              size="small"
                              value={editSeqDraft.trMs}
                              onChange={(e) =>
                                setEditSeqDraft((d) => ({ ...d, trMs: Number(e.target.value) || 0 }))
                              }
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 160 }}
                            />
                            <Typography color="text.secondary">ms</Typography>

                          </>
                        ) : (
                          <Typography>{selectedSequence.tr}</Typography>
                        )}
                      </Box>

                      {/* TE */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ minWidth: 44 }}><strong>TE:</strong></Typography>

                        {selectedSequence.type === "mtrk" ? (
                          <>
                            <TextField
                              type="number"
                              size="small"
                              value={editSeqDraft.teMs}
                              onChange={(e) =>
                                setEditSeqDraft((d) => ({ ...d, teMs: Number(e.target.value) || 0 }))
                              }
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 160 }}
                            />
                            <Typography color="text.secondary">ms</Typography>
                          </>
                        ) : (
                          <Typography>{selectedSequence.te}</Typography>
                        )}
                      </Box>

                      <Typography><strong>FA:</strong>&nbsp;{selectedSequence.fa}</Typography>
                      <Typography><strong>ACC:</strong>&nbsp;1x1</Typography>

                      {selectedSequence.type !== "mtrk" && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          TR/TE editing is available only for <strong>mtrk</strong> sequences.
                        </Alert>
                      )}
                    </Box>
                  )}
                </DialogContent>

                <DialogActions
                  sx={{
                    px: 3,
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <CmrButton variant="outlined" onClick={closeEditSequenceDialog}>Cancel</CmrButton>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <CmrButton
                      variant="contained"
                      onClick={saveEditSequenceDialog}
                      disabled={!selectedSequence || selectedSequence.type !== "mtrk"}
                    >
                      Save Changes
                    </CmrButton>

                    <CmrButton
                      variant="contained"
                      onClick={openSaveAsDialog}
                      disabled={!selectedSequence || selectedSequence.type !== "mtrk"}
                    >
                      Save as New
                    </CmrButton>
                  </Box>
                </DialogActions>
              </Dialog>

              <Dialog
                open={saveAsOpen}
                onClose={closeSaveAsDialog}
                fullWidth
                maxWidth="sm"
              >
                <DialogTitle sx={{ fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif" }}>
                  Save As New Sequence
                </DialogTitle>

                <DialogContent dividers>
                  {!selectedSequence ? (
                    <Typography color="text.secondary">No sequence selected.</Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <Typography>
                        <strong>Original ID:</strong>&nbsp;{selectedSequence.id}
                      </Typography>

                      <TextField
                        label="New ID"
                        size="small"
                        value={saveAsIdDraft}
                        onChange={(e) => setSaveAsIdDraft(e.target.value)}
                        fullWidth
                      />

                      {/* <Alert severity="info" sx={{ mt: 1 }}>
                        Demo only: this will not create a new sequence yet.
                      </Alert> */}
                    </Box>
                  )}
                </DialogContent>

                <DialogActions
                  sx={{
                    px: 3,
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <CmrButton variant="outlined" onClick={closeSaveAsDialog}>
                    Cancel
                  </CmrButton>

                  <CmrButton
                    variant="contained"
                    onClick={confirmSaveAsDemo}
                    disabled={!saveAsIdDraft.trim()}
                  >
                    Create
                  </CmrButton>
                </DialogActions>
              </Dialog>

              {/* "Add Sequence" button (display only when selectedSequence is not null) */}
              {selectedSequence && (
                <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", pt: 2 }}>
                  <CmrButton variant="contained" onClick={handleAddSequence}>
                    Add Sequence to Protocol
                  </CmrButton>
                </Box>
              )}
            </Box>

            <Divider orientation="horizontal" flexItem sx={{
              mx: 0, borderColor: "rgba(0, 0, 0, 0.35)",
              borderRightWidth: 1.5,
            }} />

            <Box sx={{ pt: 3, pb: 3 }}>
              {/* Inline row for label, upload, clear, checkbox */}
              <Box display="flex" alignItems="center" gap={1} sx={{ pb: 2 }}>

                <CmrLabel style={{ marginRight: "10px" }}>
                  Protocol:
                </CmrLabel>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={protocol}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                  >
                    <MenuItem value="">
                      <em>New Protocol</em>
                    </MenuItem>
                    <MenuItem value={10}>Protocol 1</MenuItem>
                    <MenuItem value={20}>Protocol 2</MenuItem>
                    <MenuItem value={30}>Protocol 3</MenuItem>
                  </Select>
                </FormControl>

              </Box>

              {protocolSequences.length === 0 ? (
                <Typography color="text.secondary" sx={{ pt: 2 }}>
                  Add pulse sequence(s) to the protocol
                </Typography>
              ) : (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardHeader
                    subheader="List of Sequences"
                    sx={{
                      backgroundColor: "#F7F7F9",
                      borderBottom: "1px solid #E6E6EA",
                      "& .MuiCardHeader-subheader": {
                        color: "#333"
                      }
                    }}
                  />
                  <CardContent>
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
                  </CardContent>
                  <CardActions sx={{
                    borderTop: "1px solid #E6E6EA",
                    px: 2,
                    py: 2,
                  }}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,          // spacing between buttons
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
                        sx={{ flex: 1, width: "100%" }}
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
                  </CardActions>
                </Card>
              )}
            </Box>



          </CmrPanel>

        </CmrCollapse>
      </Grid>

      <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column' }}>
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
      </Grid>
    </Grid >
    // </Box>
  );
};

export default Setup;
