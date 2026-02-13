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
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { store } from "../../features/store";
import { submitJobs } from "cloudmr-ux/core/features/setup/setupActionCreation";
import { downloadStringAsFile } from "cloudmr-ux/core/common/utilities/DownloadFromText";
import { uploadHandlerFactory } from "cloudmr-ux/core/common/utilities/SystemUtilities";
import Select from "react-select";
import OpenMedView from "../../common/components/OpenMedView/OpenMedView";

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
      receiveChannels: 16,
      transmitChannels: 0,
      coil: '16-Ch 3T Head Surface Coil',
      resolution: '2 mm isotropic',
      emSimulator: 'MARIE_3.0_WSVIE_version',
      numOfTissues: '21',
      objectName: 'Duke_2mm',
      frequency: '127.73',
      nucleus: '1 H',
      // description: 'Overlap 16 Channels Coil for 3T MRI scanner with Duke Phantom',
      image: "/models/headSurface1.png"
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

  const is16chHeadSurface = selectedModel?.name === "16-Ch 3T Head Surface Coil";

  const psiUrl = `${import.meta.env.BASE_URL}volumes/psi.nii.gz`;
  // hugo-tissuedensity.nii.gz

  console.log("psiUrl =", psiUrl);

  // force the type to be Record<string, string>
  const availableVolumes: Record<string, string> = is16chHeadSurface
    ? { "Model": psiUrl }
    : {};


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
      fileName: 'PD-Weighted_Spin_Echo.mtrk',
      alias: 'PD Weighted Spin Echo [type: mtrk]',
      // name:
      // alias: 'ISMRM25',
      tr: '4000ms',
      te: '10ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'PD-Weighted_Spin_Echo.seq',
      fileName: 'PD-Weighted_Spin_Echo.seq',
      // name: 'PD Weighted Spin Echo [type: pulseq]',
      alias: 'PD Weighted Spin Echo [type: pulseq]',
      tr: '4000ms',
      te: '10ms',
      fa: [90, 180],
      type: 'pulseq'
    },
    {
      id: 'T1-Weighted_Spin_Echo.mtrk',
      fileName: 'T1-Weighted_Spin_Echo.mtrk',
      // name: 'T1 Weighted Spin Echo [type: mtrk]',
      alias: 'T1 Weighted Spin Echo [type: mtrk]',
      tr: '600ms',
      te: '10ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'T1-Weighted_Spin_Echo.seq',
      fileName: 'T1-Weighted_Spin_Echo.seq',
      alias: 'T1 Weighted Spin Echo [type: pulseq]',
      tr: '600ms',
      te: '10ms',
      fa: [90, 180],
      type: 'pulseq'
    },
    {
      id: 'T1-Weighted_Spoiled_GRE.mtrk',
      fileName: 'T1-Weighted_Spoiled_GRE.mtrk',
      alias: 'T1 Weighted Spoiled GRE [type: mtrk]',
      // name:
      tr: '40ms',
      te: '10ms',
      fa: [15],
      type: 'mtrk'
    },
    {
      id: 'T1-Weighted_Spoiled_GRE.seq',
      fileName: 'T1-Weighted_Spoiled_GRE.seq',
      alias: 'T1 Weighted Spoiled GRE [type: pulseq]',
      // name
      tr: '40ms',
      te: '10ms',
      fa: [15],
      type: 'pulseq'
    },
    {
      id: 'T2-Weighted_Spin_Echo.mtrk',
      fileName: 'T2-Weighted_Spin_Echo.mtrk',
      alias: 'T2 Weighted Spin Echo [type: mtrk]',
      // name
      tr: '4000ms',
      te: '80ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'T2-Weighted_Spin_Echo.seq',
      fileName: 'T2-Weighted_Spin_Echo.mtrk',
      alias: 'T2 Weighted Spin Echo [type: pulseq]',
      // name:
      tr: '4000ms',
      te: '80ms',
      fa: [90, 180],
      type: 'pulseq'
    },
  ];

  // Duplicates / user-created sequences live here (NOT in sequenceOptions)
  const [customSequences, setCustomSequences] = useState<typeof sequenceOptions>([]);

  const allSequences = [...sequenceOptions, ...customSequences];

  const getSequenceById = (id: string) =>
    allSequences.find((s) => s.id === id) ?? null;

  const PROTOCOL_1_SEQUENCE_IDS = [
    "PD-Weighted_Spin_Echo.mtrk",
    "T1-Weighted_Spin_Echo.seq",
    "T1-Weighted_Spoiled_GRE.seq",
  ];

  const uploadedFiles2: UploadedFile[] = sequenceOptions.map((opt, index) => ({
    id: index + 1,          // numeric ID for SelectUpload
    fileName: opt.alias ?? opt.fileName ?? opt.id,   // what shows in dropdown
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

  // true only when user picked from the master dropdown (library)
  const [selectedFromLibrary, setSelectedFromLibrary] = useState(false);

  // true when the user clicked a row from the protocol list
  const [selectedFromProtocolList, setSelectedFromProtocolList] = useState(false);

  const handleSequenceSelected = (file?: UploadedFile) => {
    setIsEditingSeq(false);

    if (!file) {
      setSelectedSequence(null);
      setSelectedFromLibrary(false);
      setSelectedFromProtocolList(false);
      return;
    }

    const match = allSequences.find((opt) => opt.id === file.link);
    setSelectedSequence(match ?? null);

    // dropdown is the master library selection
    setSelectedFromLibrary(true);

    setSelectedFromProtocolList(false);

    // un-highlight protocol selection when choosing from library
    setSelectedProtocolSeqId(null);
  };

  const clearSelectedSequence = () => {
    setIsEditingSeq(false);
    setSelectedSequence(null);
  };
  //end

  // --- Inline Edit (TR/TE) ---
  const [isEditingSeq, setIsEditingSeq] = useState(false);

  const [editSeqDraft, setEditSeqDraft] = useState<{
    alias: string;
    trMs: number;
    teMs: number;
  }>({ alias: "", trMs: 0, teMs: 0 });


  const parseMs = (v: string) => {
    const n = Number(String(v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const formatMs = (n: number) => `${n}ms`;

  const startInlineEdit = () => {
    if (!selectedSequence) return;

    setEditSeqDraft({
      alias: selectedSequence.alias ?? "",
      trMs: parseMs(selectedSequence.tr),
      teMs: parseMs(selectedSequence.te),
    });

    setIsEditingSeq(true);
  };

  const cancelInlineEdit = () => {
    if (selectedSequence) {
      setEditSeqDraft({
        alias: selectedSequence.alias ?? "",
        trMs: parseMs(selectedSequence.tr),
        teMs: parseMs(selectedSequence.te),
      });
    }
    setIsEditingSeq(false);
  };

  const isMasterSequence = (id: string) => sequenceOptions.some((s) => s.id === id);

  const makeUniqueId = (base: string) => {
    const taken = new Set([
      ...sequenceOptions.map((s) => s.id),
      ...customSequences.map((s) => s.id),
      ...protocolSequences.map((s) => s.id),
    ]);

    let id = base;
    let i = 1;
    while (taken.has(id)) id = `${base}${i++}`;
    return id;
  };


  const saveInlineEdit = () => {
    if (!selectedSequence) return;

    const updated =
      selectedSequence.type === "mtrk"
        ? {
          ...selectedSequence,
          alias: editSeqDraft.alias.trim(),
          tr: formatMs(editSeqDraft.trMs),
          te: formatMs(editSeqDraft.teMs),
        }
        : {
          ...selectedSequence,
          alias: editSeqDraft.alias.trim(),
        };

    // If we're editing a master library sequence, do not modify it.
    // Create a new custom copy that contains the edited values.
    if (isMasterSequence(selectedSequence.id)) {
      const newId = makeUniqueId(`${selectedSequence.id}__edited`);

      const customCopy = {
        ...updated,
        id: newId,
        // keep the alias as user entered, OR if you prefer, suffix it:
        // alias: `${updated.alias}_edited`,
      };

      // store as custom, not in master list
      setCustomSequences((prev) => [...prev, customCopy]);

      // show the edited copy in the details card
      setSelectedSequence(customCopy);

      // treat it as still coming from "library flow" so user can add it
      setSelectedFromLibrary(true);
      setSelectedFromProtocolList(false);
      setSelectedProtocolSeqId(null);

      setIsEditingSeq(false);
      return;
    }

    // otherwise (already custom or protocol-created), allow updating it in place:
    setSelectedSequence(updated);

    // keep protocol list in sync if it contains this sequence
    setProtocolSequences((prev) =>
      prev.map((s) => {
        if (s.id !== updated.id) return s;

        if (updated.type === "mtrk") {
          return { ...s, alias: updated.alias, tr: updated.tr, te: updated.te };
        }

        return { ...s, alias: updated.alias };
      })
    );

    // keep customSequences in sync if it's a custom item
    setCustomSequences((prev) =>
      prev.map((s) => {
        if (s.id !== updated.id) return s;

        if (updated.type === "mtrk") {
          return { ...s, alias: updated.alias, tr: updated.tr, te: updated.te };
        }

        return { ...s, alias: updated.alias };
      })
    );

    setIsEditingSeq(false);
  };

  // -- end inline edit --

  // --- Protocol Dropdown ---
  const [protocol, setProtocol] = useState<string>("");

  // add react-select options + a handler that reuses your existing logic
  type ProtocolOption = { value: string; label: string };

  const protocolOptions: ProtocolOption[] = [
    { value: "", label: "New Protocol" },
    { value: "10", label: "Protocol 1" },
    { value: "20", label: "Protocol 2" },
    { value: "30", label: "Protocol 3" },
  ];

  const handleProtocolChange = (opt: ProtocolOption | null) => {
    const value = opt?.value ?? "";
    setProtocol(value);

    // Reset check state when switching protocols
    setProtocolChecked({});

    if (value === "") {
      setProtocolSequences([]);
      setSelectedSequence(null);
      setSelectedProtocolSeqId(null);
      return;
    }

    if (value === "10") {
      const loaded = PROTOCOL_1_SEQUENCE_IDS
        .map((id) => getSequenceById(id))
        .filter((s): s is typeof sequenceOptions[number] => Boolean(s));

      setProtocolSequences(loaded);

      if (loaded.length > 0) {
        handleSelectProtocolSequence(loaded[0]);
      } else {
        setSelectedSequence(null);
        setSelectedProtocolSeqId(null);
      }
      return;
    }

    // Protocol 2/3 placeholder
    setProtocolSequences([]);
    setSelectedSequence(null);
    setSelectedProtocolSeqId(null);
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

    if (isEditingSeq) return;

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


  // demo: do nothing except close
  const confirmSaveAsDemo = () => {
    setSaveAsOpen(false);
    // no changes, no additions, no edits
  };

  // -- make list of sequences clickable --
  // which item is "active" in the protocol list UI
  const [selectedProtocolSeqId, setSelectedProtocolSeqId] = useState<string | null>(null);

  const handleSelectProtocolSequence = (seq: (typeof sequenceOptions)[number]) => {
    setSelectedSequence(seq);
    setSelectedProtocolSeqId(seq.id);

    // this is not a "new pick from library"
    setSelectedFromLibrary(false);

    setSelectedFromProtocolList(true);

    setIsEditingSeq(false);

    setEditSeqDraft({
      alias: seq.alias ?? "",
      trMs: parseMs(seq.tr),
      teMs: parseMs(seq.te),
    });
  };
  // -- end ---

  //-- handler for Duplicating Sequence in Protocol ---
  const handleDuplicateSequenceInProtocol = (seq: (typeof sequenceOptions)[number]) => {
    // build ids that already exist in protocol + customs (avoid collisions)
    const takenIds = new Set([
      ...protocolSequences.map((s) => s.id),
      ...customSequences.map((s) => s.id),
      ...sequenceOptions.map((s) => s.id),
    ]);

    const baseId = `${seq.id}__copy`;
    let newId = baseId;
    let i = 1;
    while (takenIds.has(newId)) newId = `${baseId}${i++}`;

    const takenAliases = new Set([
      ...protocolSequences.map((s) => s.alias),
      ...customSequences.map((s) => s.alias),
    ]);

    const baseAlias = `${seq.alias}_copy`;
    let newAlias = baseAlias;
    let j = 2;
    while (takenAliases.has(newAlias)) newAlias = `${baseAlias}${j++}`;

    const duplicated = {
      ...seq,
      id: newId,
      alias: newAlias,
    };

    // 1) store it in the separate "custom" list (your caveat)
    setCustomSequences((prev) => [...prev, duplicated]);

    // 2) also insert it into the protocol list right after the original
    setProtocolSequences((prev) => {
      const idx = prev.findIndex((s) => s.id === seq.id);
      if (idx === -1) return [...prev, duplicated];
      const next = [...prev];
      next.splice(idx + 1, 0, duplicated);
      return next;
    });

    // 3) optionally auto-select it in the details card
    handleSelectProtocolSequence(duplicated);
  };
  // --end --

  const selectedAlreadyInProtocol =
    !!selectedSequence && protocolSequences.some((s) => s.id === selectedSequence.id);

  // Enable only when selection came from dropdown/master flow AND not already in protocol.
  // (If user is just viewing items in protocol list, it's disabled.)
  const canAddToProtocol =
    !!selectedSequence && !isEditingSeq && selectedFromLibrary && !selectedFromProtocolList && !selectedAlreadyInProtocol;

  return (
    <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
      <Grid item xs={12} md={5} >
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
                        <strong>Nucleus:</strong> {selectedModel.nucleus}
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
                        <strong>Receive Channels:</strong> {selectedModel.receiveChannels}
                      </Typography>

                      <Typography>
                        <strong>Transmit Channels:</strong> {selectedModel.transmitChannels}
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
                    chosenFile={selectedSequence?.alias}
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
                      selectedSequence && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {!isEditingSeq ? (
                            <Tooltip title="Edit">
                              <IconButton aria-label="edit" onClick={startInlineEdit}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Save">
                                <IconButton aria-label="save" onClick={saveInlineEdit}>
                                  <SaveIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Cancel">
                                <IconButton aria-label="cancel" onClick={cancelInlineEdit}>
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      )
                    }
                  />
                  <CardContent>
                    <Box textAlign="left" height="100%">
                      <Typography><strong>File Name:</strong>&nbsp;{selectedSequence.id}</Typography>
                      {/* Alias */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography>
                          <strong>Alias:</strong>
                        </Typography>

                        {isEditingSeq ? (
                          <TextField
                            size="small"
                            value={editSeqDraft.alias}
                            onChange={(e) =>
                              setEditSeqDraft((d) => ({ ...d, alias: e.target.value }))
                            }
                            sx={{ width: 300, mt: 1, mb: 0.5 }}
                          />
                        ) : (
                          <Typography>{selectedSequence.alias}</Typography>
                        )}
                      </Box>

                      {/* TR */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography>
                          <strong>TR:</strong>
                        </Typography>

                        {isEditingSeq && selectedSequence.type === "mtrk" ? (
                          <>
                            <TextField
                              type="number"
                              size="small"
                              value={editSeqDraft.trMs}
                              onChange={(e) =>
                                setEditSeqDraft((d) => ({ ...d, trMs: Number(e.target.value) || 0 }))
                              }
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 140, mt: 1, mb: 0.5 }}
                            />
                            <Typography color="text.secondary">ms</Typography>
                          </>
                        ) : (
                          <Typography>{selectedSequence.tr}</Typography>
                        )}
                      </Box>

                      {/* TE */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography>
                          <strong>TE:</strong>
                        </Typography>

                        {isEditingSeq && selectedSequence.type === "mtrk" ? (
                          <>
                            <TextField
                              type="number"
                              size="small"
                              value={editSeqDraft.teMs}
                              onChange={(e) =>
                                setEditSeqDraft((d) => ({ ...d, teMs: Number(e.target.value) || 0 }))
                              }
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 140, mt: 1, mb: 1 }}
                            />
                            <Typography color="text.secondary">ms</Typography>
                          </>
                        ) : (
                          <Typography>{selectedSequence.te}</Typography>
                        )}
                      </Box>

                      <Typography><strong>FA:</strong>&nbsp;{selectedSequence.fa}</Typography>
                      <Typography><strong>ACC:</strong>&nbsp;1x1</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* "Add Sequence" button (display only when selectedSequence is not null) */}
              {selectedSequence && (
                <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", pt: 2 }}>
                  <CmrButton
                    variant="contained"
                    onClick={handleAddSequence}
                    disabled={!canAddToProtocol}
                  >
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

                <Box sx={{ minWidth: 150 }}>
                  <Select
                    value={protocolOptions.find((o) => o.value === protocol) ?? protocolOptions[0]}
                    onChange={handleProtocolChange}
                    options={protocolOptions}
                    isSearchable={true}
                    styles={{
                      ...selectStyles,
                      container: (base: any) => ({ ...base, width: "100%" }),
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Box>

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
                        protocolSequences.map((seq) => {
                          const isActive = selectedProtocolSeqId === seq.id;

                          return (
                            <Box
                              key={seq.id}
                              onClick={() => handleSelectProtocolSequence(seq)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1,
                                py: 0.75,
                                borderRadius: 1,
                                cursor: "pointer",
                                border: isActive ? "1px solid #1578A1" : "1px solid transparent",
                                backgroundColor: isActive ? "#E3F1F6" : "transparent",
                                "&:hover": {
                                  backgroundColor: isActive ? "#E3F1F6" : "rgba(0,0,0,0.04)",
                                },
                              }}
                            >
                              {/* <Checkbox
                                size="small"
                                checked={!!protocolChecked[seq.id]}
                                onChange={(e) => {
                                  e.stopPropagation(); // don't select row when checking
                                  toggleProtocolChecked(seq.id);
                                }}
                                sx={{
                                  p: 0,
                                  mr: 0.5,
                                  "&.Mui-checked": { color: "#1578A1 !important" },
                                }}
                              /> */}

                              <Typography sx={{ flex: 1 }}>
                                {seq.alias}
                              </Typography>


                              <Tooltip title="Duplicate">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateSequenceInProtocol(seq);
                                  }}
                                  sx={{ ml: 0.5 }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation(); // don't select row when deleting
                                  handleRemoveSequenceFromProtocol(seq.id);
                                }}
                                sx={{ ml: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>

                            </Box>
                          );
                        })
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
        {/* <Box sx={{ width: "100%" }}>
          <OpenMedView availableVolumes={availableVolumes} />
        </Box> */}
        {Object.keys(availableVolumes).length > 0 ? (
          <OpenMedView availableVolumes={availableVolumes} />
        ) : (
          <div style={{ padding: '1rem', fontStyle: 'italic', color: '#888' }}>
            Select model to display
          </div>
        )}

      </Grid>
    </Grid >
  );
};

export default Setup;
