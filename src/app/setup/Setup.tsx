import React, { Fragment, useEffect, useState, useRef } from "react";
import "./Setup.scss";
import { CmrCollapse, CmrPanel, CmrConfirmation } from "cloudmr-ux";
import NiiVue, { nv } from "../../common/components/Niivue";
import {
  getUploadedData,
  uploadData,
} from "cloudmr-ux/core/features/data/dataActionCreation";
import { useAppSelector } from "../../features/hooks";
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
  FormHelperText,
  Snackbar,
  Slide,
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

// Add volumes from public/volumes here: display name -> filename (order by ascending numeric id in info.json data)
const SETUP_VOLUME_MAP: Record<string, string> = {
  "Noise Coefficient Matrix": "psi.nii.gz",
  "Coil Sensitivity 1": "b1m_001.nii.gz",
  "Coil Sensitivity 2": "b1m_002.nii.gz",
  "Coil Sensitivity 3": "b1m_003.nii.gz",
  "Coil Sensitivity 4": "b1m_004.nii.gz",
  "Coil Sensitivity 5": "b1m_005.nii.gz",
  "Coil Sensitivity 6": "b1m_006.nii.gz",
  "Coil Sensitivity 7": "b1m_007.nii.gz",
  "Coil Sensitivity 8": "b1m_008.nii.gz",
  "Coil Sensitivity 9": "b1m_009.nii.gz",
  "Coil Sensitivity 10": "b1m_010.nii.gz",
  "Coil Sensitivity 11": "b1m_011.nii.gz",
  "Coil Sensitivity 12": "b1m_012.nii.gz",
  "Coil Sensitivity 13": "b1m_013.nii.gz",
  "Coil Sensitivity 14": "b1m_014.nii.gz",
  "Coil Sensitivity 15": "b1m_015.nii.gz",
  "Coil Sensitivity 16": "b1m_016.nii.gz",
  "T1": "t1.nii.gz",
  "T2": "t2.nii.gz",
  "T2*": "t2star.nii.gz",
  "Proton Density": "rhoh.nii.gz",
  "Mass Density": "rhom.nii.gz",
  "Chemical Shift": "dw.nii.gz",
  "Relative Permittivity": "epsilon_r.nii.gz",
  "Conductivity": "sigma_e.nii.gz",
  "Relative Permeability": "mur.nii.gz",
  "Heat Capacity": "c.nii.gz",
  "Thermal Conductivity": "k.nii.gz",
  "Perfusion": "w.nii.gz",
  "Heat Generation Rate": "q.nii.gz",
};

const Setup = () => {
  const { accessToken } = useAppSelector((state) => state.authenticate);

  const [openModelPanel, setOpenModelPanel] = useState<Array<string | number>>([0]); // open by default
  const [openPulsePanel, setOpenPulsePanel] = useState<Array<string | number>>([]); // closed by default
  const [openFieldofViewPanel, setOpenFieldofViewPanel] = useState<Array<string | number>>([0]); // closed by default

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

  const baseUrl = `${import.meta.env.BASE_URL}volumes/`;
  const availableVolumes: Record<string, string> = is16chHeadSurface
    ? Object.fromEntries(
        Object.entries(SETUP_VOLUME_MAP).map(([name, filename]) => [name, baseUrl + filename])
      )
    : {};

  // NiiVue viewer state (matching Results.tsx)
  const [selectedVolume, setSelectedVolume] = useState(0);
  const [warning, setWarning] = useState("");
  const [warningOpen, setWarningOpen] = useState(false);

  // Convert availableVolumes to niis format expected by NiiVue
  const setupNiis = Object.entries(availableVolumes).map(([name, url], index) => ({
    id: index,
    dim: 3,
    name,
    filename: url.split("/").pop() || `${name}.nii.gz`,
    type: "nifti",
    link: url,
  }));

  const [successToastOpen, setSuccessToastOpen] = useState(false);

  const warn = (message: string) => {
    setWarning(message);
    setWarningOpen(true);
    setTimeout(() => {
      setWarningOpen(false);
      setWarning("");
    }, 5000);
  };

  // Load volume into NiiVue when availableVolumes changes
  useEffect(() => {
    if (Object.keys(availableVolumes).length > 0) {
      const entries = Object.entries(availableVolumes);
      const [name, url] = entries[0];
      const vol = {
        url,
        name: url.split("/").pop() || `${name}.nii.gz`,
        alias: name,
      };
      nv.loadVolumes([vol]);
      nv.closeDrawing();
      setSelectedVolume(0);
      setTimeout(() => nv.resizeListener(), 700);
    } else {
      nv.loadVolumes([]);
    }
    return () => {
      nv.loadVolumes([]);
    };
  }, [is16chHeadSurface]);

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
      alias: 'PD-Weighted_Spin_Echo',
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
      alias: 'PD-Weighted_Spin_Echo',
      tr: '4000ms',
      te: '10ms',
      fa: [90, 180],
      type: 'pulseq'
    },
    {
      id: 'T1-Weighted_Spin_Echo.mtrk',
      fileName: 'T1-Weighted_Spin_Echo.mtrk',
      // name: 'T1 Weighted Spin Echo [type: mtrk]',
      alias: 'T1-Weighted_Spin_Echo',
      tr: '600ms',
      te: '10ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'T1-Weighted_Spin_Echo.seq',
      fileName: 'T1-Weighted_Spin_Echo.seq',
      alias: 'T1-Weighted_Spin_Echo',
      tr: '600ms',
      te: '10ms',
      fa: [90, 180],
      type: 'pulseq'
    },
    {
      id: 'T1-Weighted_Spoiled_GRE.mtrk',
      fileName: 'T1-Weighted_Spoiled_GRE.mtrk',
      alias: 'T1-Weighted_Spoiled_GRE',
      // name:
      tr: '40ms',
      te: '10ms',
      fa: [15],
      type: 'mtrk'
    },
    {
      id: 'T1-Weighted_Spoiled_GRE.seq',
      fileName: 'T1-Weighted_Spoiled_GRE.seq',
      alias: 'T1 Weighted Spoiled GRE',
      // name
      tr: '40ms',
      te: '10ms',
      fa: [15],
      type: 'pulseq'
    },
    {
      id: 'T2-Weighted_Spin_Echo.mtrk',
      fileName: 'T2-Weighted_Spin_Echo.mtrk',
      alias: 'T2 Weighted Spin Echo',
      // name
      tr: '4000ms',
      te: '80ms',
      fa: [90, 180],
      type: 'mtrk'
    },
    {
      id: 'T2-Weighted_Spin_Echo.seq',
      fileName: 'T2-Weighted_Spin_Echo.mtrk',
      alias: 'T2 Weighted Spin Echo',
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
    // Create a new custom copy only when something actually changed.
    if (isMasterSequence(selectedSequence.id)) {
      const aliasUnchanged = updated.alias === (selectedSequence.alias ?? "").trim();
      const trUnchanged =
        selectedSequence.type !== "mtrk" || updated.tr === selectedSequence.tr;
      const teUnchanged =
        selectedSequence.type !== "mtrk" || updated.te === selectedSequence.te;

      if (aliasUnchanged && trUnchanged && teUnchanged) {
        // No changes: just exit edit mode, do not create a copy
        setIsEditingSeq(false);
        return;
      }

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

  // Saved protocols (user-created). Persisted to localStorage.
  type SavedProtocol = { id: string; label: string; sequenceIds: string[] };
  const SAVED_PROTOCOLS_KEY = "camrie-saved-protocols";

  const loadSavedProtocols = (): SavedProtocol[] => {
    try {
      const raw = localStorage.getItem(SAVED_PROTOCOLS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (p: unknown): p is SavedProtocol =>
          p != null &&
          typeof p === "object" &&
          typeof (p as SavedProtocol).id === "string" &&
          typeof (p as SavedProtocol).label === "string" &&
          Array.isArray((p as SavedProtocol).sequenceIds)
      );
    } catch {
      return [];
    }
  };

  const [savedProtocols, setSavedProtocols] = useState<SavedProtocol[]>(loadSavedProtocols);

  useEffect(() => {
    if (savedProtocols.length > 0) {
      localStorage.setItem(SAVED_PROTOCOLS_KEY, JSON.stringify(savedProtocols));
    } else {
      localStorage.removeItem(SAVED_PROTOCOLS_KEY);
    }
  }, [savedProtocols]);

  type ProtocolOption = { value: string; label: string };

  const baseProtocolOptions: ProtocolOption[] = [
    { value: "", label: "New Protocol" },
    { value: "10", label: "Protocol 1" },
    { value: "20", label: "Protocol 2" },
    { value: "30", label: "Protocol 3" },
  ];
  const protocolOptions: ProtocolOption[] = [
    ...baseProtocolOptions,
    ...savedProtocols.map((p) => ({ value: p.id, label: p.label })),
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

    // Saved (user-created) protocol
    const saved = savedProtocols.find((p) => p.id === value);
    if (saved) {
      const loaded = saved.sequenceIds
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


  // --- Save Protocol Dialog ---
  const [saveProtocolOpen, setSaveProtocolOpen] = useState(false);
  const [saveProtocolNameDraft, setSaveProtocolNameDraft] = useState("");
  const [saveProtocolError, setSaveProtocolError] = useState("");

  const handleSaveProtocolClick = () => {
    // Saved protocol: update in place, no dialog
    if (protocol.startsWith("saved-")) {
      setSavedProtocols((prev) =>
        prev.map((p) =>
          p.id === protocol ? { ...p, sequenceIds: protocolSequences.map((s) => s.id) } : p
        )
      );
      setSuccessToastOpen(true);
      return;
    }
    // New Protocol or built-in: open dialog to create new protocol
    setSaveProtocolError("");
    const currentLabel = protocolOptions.find((o) => o.value === protocol)?.label ?? "";
    setSaveProtocolNameDraft(protocol ? `Copy of ${currentLabel}` : "");
    setSaveProtocolOpen(true);
  };

  const confirmSaveProtocol = () => {
    const name = saveProtocolNameDraft.trim();
    if (!name) {
      setSaveProtocolError("Please enter a protocol name.");
      return;
    }
    if (savedProtocols.some((p) => p.label.toLowerCase() === name.toLowerCase())) {
      setSaveProtocolError("A protocol with this name already exists.");
      return;
    }

    const newProtocol: SavedProtocol = {
      id: `saved-${Date.now()}`,
      label: name,
      sequenceIds: protocolSequences.map((s) => s.id),
    };

    setSavedProtocols((prev) => [...prev, newProtocol]);
    setProtocol(newProtocol.id);
    setSaveProtocolOpen(false);
    setSaveProtocolNameDraft("");
    setSaveProtocolError("");
  };

  const cancelSaveProtocol = () => {
    setSaveProtocolOpen(false);
    setSaveProtocolNameDraft("");
    setSaveProtocolError("");
  };

  // --- Edit Protocol Name (saved protocols only) ---
  const [isEditingProtocolName, setIsEditingProtocolName] = useState(false);
  const [editProtocolNameDraft, setEditProtocolNameDraft] = useState("");
  const [editProtocolNameError, setEditProtocolNameError] = useState("");

  const isSavedProtocol = protocol.startsWith("saved-");

  const startEditProtocolName = () => {
    if (!isSavedProtocol) return;
    const label = protocolOptions.find((o) => o.value === protocol)?.label ?? "";
    setEditProtocolNameDraft(label);
    setEditProtocolNameError("");
    setIsEditingProtocolName(true);
  };

  const saveEditProtocolName = () => {
    const name = editProtocolNameDraft.trim();
    if (!name) return;
    const otherNames = savedProtocols
      .filter((p) => p.id !== protocol)
      .map((p) => p.label.toLowerCase());
    if (otherNames.includes(name.toLowerCase())) {
      setEditProtocolNameError("A protocol with this name already exists.");
      return;
    }
    setEditProtocolNameError("");
    setSavedProtocols((prev) =>
      prev.map((p) => (p.id === protocol ? { ...p, label: name } : p))
    );
    setIsEditingProtocolName(false);
  };

  const cancelEditProtocolName = () => {
    setIsEditingProtocolName(false);
    setEditProtocolNameDraft("");
    setEditProtocolNameError("");
  };

  const handleDeleteProtocol = (id: string) => {
    if (!id.startsWith("saved-")) return;
    setSavedProtocols((prev) => prev.filter((p) => p.id !== id));
    if (protocol === id) {
      setProtocol("");
      setProtocolSequences([]);
      setSelectedSequence(null);
      setSelectedProtocolSeqId(null);
    }
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
      fileName: seq.fileName, // keep original file name; only alias gets _copy
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
    <Fragment>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        TransitionComponent={(props: any) => <Slide {...props} direction="right" />}
        open={warningOpen}
        autoHideDuration={7000}
        onClose={() => setWarningOpen(false)}
      >
        <Alert
          onClose={() => setWarningOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {warning}
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        TransitionComponent={(props: any) => <Slide {...props} direction="right" />}
        open={successToastOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessToastOpen(false)}
      >
        <Alert
          onClose={() => setSuccessToastOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Protocol changes saved.
        </Alert>
      </Snackbar>
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
                        <Typography><strong>File Name:</strong>&nbsp;{selectedSequence.fileName ?? selectedSequence.id}</Typography>
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
                      formatOptionLabel={(option: ProtocolOption) => (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <span>{option.label}</span>
                          {option.value.startsWith("saved-") && (
                            <Tooltip title="Delete protocol">
                              <IconButton
                                size="small"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteProtocol(option.value);
                                }}
                                sx={{ p: 0.25, "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
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
                      subheader={
                        isEditingProtocolName ? (
                          <TextField
                            size="small"
                            value={editProtocolNameDraft}
                            onChange={(e) => {
                              setEditProtocolNameDraft(e.target.value);
                              setEditProtocolNameError("");
                            }}
                            error={!!editProtocolNameError}
                            helperText={editProtocolNameError}
                            sx={{ width: 220 }}
                            autoFocus
                          />
                        ) : (
                          protocolOptions.find((o) => o.value === protocol)?.label ?? "New Protocol"
                        )
                      }
                      action={
                        isSavedProtocol && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {!isEditingProtocolName ? (
                              <Tooltip title="Edit">
                                <IconButton aria-label="edit protocol" size="small" onClick={startEditProtocolName}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
                                <Tooltip title="Save">
                                  <IconButton aria-label="save" size="small" onClick={saveEditProtocolName}>
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton aria-label="cancel" size="small" onClick={cancelEditProtocolName}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        )
                      }
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
                          onClick={handleSaveProtocolClick}
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
          {/* Field of View - NiiVue viewer (same as Results) */}
          {Object.keys(availableVolumes).length > 0 ? (
            <CmrCollapse activeKey={openFieldofViewPanel}>
              <CmrPanel header="Field of View" >
                <NiiVue
                  niis={setupNiis}
                  warn={warn}
                  setWarning={setWarning}
                  setWarningOpen={setWarningOpen}
                  setSelectedVolume={setSelectedVolume}
                  selectedVolume={selectedVolume}
                  key="setup-niivue"
                  rois={[]}
                  pipelineID="setup"
                  saveROICallback={() => { }}
                  accessToken={accessToken ?? ""}
                />
              </CmrPanel>
            </CmrCollapse>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "rgba(0,0,0,0.4)",
                minHeight: 200,
                fontStyle: "italic",
              }}
            >
              Select model to display
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Save Protocol Dialog */}
      <Dialog open={saveProtocolOpen} onClose={cancelSaveProtocol} maxWidth="xs" fullWidth>
        <DialogTitle>Save Protocol</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Protocol name"
            fullWidth
            variant="outlined"
            value={saveProtocolNameDraft}
            onChange={(e) => setSaveProtocolNameDraft(e.target.value)}
            error={!!saveProtocolError}
            helperText={saveProtocolError}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmSaveProtocol();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CmrButton variant="outlined" onClick={cancelSaveProtocol}>
            Cancel
          </CmrButton>
          <CmrButton variant="contained" onClick={confirmSaveProtocol}>
            Save
          </CmrButton>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

export default Setup;
