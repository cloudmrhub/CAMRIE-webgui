import React, { Fragment, useCallback, useEffect, useMemo, useState, useRef } from "react";
import "./Setup.scss";
import { CmrCollapse, CmrPanel, CmrConfirmation, CmrCheckbox } from "cloudmr-ux";
import NiiVue, { nv } from "../../common/components/Niivue";
import {
  removeFovBoundingBoxMesh,
  volumeWorldAabbMm,
  volumePhysicalExtentMm,
  getSliceCenterMmForGeometryExport,
  resetFovSliceTranslation,
  type FovPlaneOrientation,
} from "../../common/utilities/fovBoundingBoxMesh";
import {
  buildBackendSequencesPayload,
  buildSequenceGeometryJson,
  areEncodingDirectionsOnSameAnatomicalAxis,
  clampEncodingDirectionToOrientation,
  DEFAULT_SEQUENCE_GEOMETRY_FORM,
  ENCODING_DIRECTION_OPTIONS,
  formStateToCaptureInput,
  resolveOrthogonalEncodingDirections,
  sequenceGeometryJsonToFormState,
  type EncodingDirectionId,
  type SequenceGeometryFormState,
  type LegacySequenceGeometryJson,
  type SequenceGeometryJson,
} from "../../common/utilities/sequenceGeometry";
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
  Tooltip,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Snackbar,
  Slide,
  Slider,
  InputAdornment,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { AxiosResponse } from "axios";
import { store } from "../../features/store";
import { submitJobs } from "cloudmr-ux/core/features/setup/setupActionCreation";
import { downloadStringAsFile } from "cloudmr-ux/core/common/utilities/DownloadFromText";
import { uploadHandlerFactory } from "cloudmr-ux/core/common/utilities/SystemUtilities";
import Select from "react-select";
import { fetchMarieZipManifest } from "../../common/utilities/marieZipManifest";
import { preprocessMarieModelZip } from "../../common/utilities/preprocessMarieModelZip";
import { niivueSafeVolumeName } from "../../common/utilities/niivueVolumeUrl";

/** Preset row or a MARIE `.zip` loaded via `/unzip` (volumes keyed by manifest `name`). */
interface SetupModelOption {
  id: string;
  name: string;
  objectName: string;
  b0: string;
  nucleus: string;
  frequency: string;
  resolution: string;
  numOfTissues: string;
  coil: string;
  receiveChannels: number;
  transmitChannels: number;
  emSimulator: string;
  image: string;
  volumeMapFromZip?: Record<string, string>;
}

// Add volumes from public/volumes here: display name -> filename (order by ascending numeric id in info.json data)
const SETUP_VOLUME_MAP: Record<string, string> = {
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
};

/** Display name → filename under `public/volumes/7T-Head-Triangular-Coil/` (8 Rx + 8 Tx; see info.json). */
const SETUP_VOLUME_MAP_TRIANGULAR: Record<string, string> = {
  "Noise Covariance Matrix": "phi.nii.gz",
  "Noise Coefficient Matrix": "psi.nii.gz",
  "Coil Sensitivity 1": "b1m_001.nii.gz",
  "Coil Sensitivity 2": "b1m_002.nii.gz",
  "Coil Sensitivity 3": "b1m_003.nii.gz",
  "Coil Sensitivity 4": "b1m_004.nii.gz",
  "Coil Sensitivity 5": "b1m_005.nii.gz",
  "Coil Sensitivity 6": "b1m_006.nii.gz",
  "Coil Sensitivity 7": "b1m_007.nii.gz",
  "Coil Sensitivity 8": "b1m_008.nii.gz",
  "Transmit Field 1": "b1p_001.nii.gz",
  "Transmit Field 2": "b1p_002.nii.gz",
  "Transmit Field 3": "b1p_003.nii.gz",
  "Transmit Field 4": "b1p_004.nii.gz",
  "Transmit Field 5": "b1p_005.nii.gz",
  "Transmit Field 6": "b1p_006.nii.gz",
  "Transmit Field 7": "b1p_007.nii.gz",
  "Transmit Field 8": "b1p_008.nii.gz",
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

/** Display name → filename under `public/volumes/3T-Head-Birdcage-Coil/` (2 Rx + 2 Tx; see info.json). */
const SETUP_VOLUME_MAP_BIRDCAGE: Record<string, string> = {
  "Noise Covariance Matrix": "phi.nii.gz",
  "Noise Coefficient Matrix": "psi.nii.gz",
  "Coil Sensitivity 1": "b1m_001.nii.gz",
  "Coil Sensitivity 2": "b1m_002.nii.gz",
  "Transmit Field 1": "b1p_001.nii.gz",
  "Transmit Field 2": "b1p_002.nii.gz",
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

const MODEL_16CH_SURFACE = "16-Ch 3T Head Surface Coil";
const MODEL_BIRDCAGE = "3T Head Birdcage Coil";
const MODEL_TRIANGULAR = "8-Ch 7T Head Triangular Coil";

const BASE_VOL = `${import.meta.env.BASE_URL}volumes/`;
const baseUrlHeadSurfaceCoil = `${BASE_VOL}3T-Head-Surface-Coil/`;
const baseUrl3TBirdcageCoil = `${BASE_VOL}3T-Head-Birdcage-Coil/`;
const baseUrl7TTriangularCoil = `${BASE_VOL}7T-Head-Triangular-Coil/`;

/**
 * MARIE `info.json` volume names use underscores (e.g. `Proton_Density`); built-in maps use spaces.
 * Pick the same logical default (proton density / rhoh) for Niivue’s initial load.
 */
function indexOfPreferredMarieVolume(entries: [string, string][]): number {
  const labels = ["Proton Density", "Proton_Density"];
  for (const label of labels) {
    const i = entries.findIndex(([name]) => name === label);
    if (i >= 0) return i;
  }
  const byName = entries.findIndex(([name]) => /rhoh/i.test(name.replace(/\s+/g, "_")));
  if (byName >= 0) return byName;
  const byUrl = entries.findIndex(([, url]) => /rhoh/i.test(url));
  if (byUrl >= 0) return byUrl;
  return 0;
}

/** Built-in phantom/coil presets for the Model dropdown (non-zip). */
const CAMRIE_PRESET_MODELS: SetupModelOption[] = [
  {
    id: "1",
    name: "16-Ch 3T Head Surface Coil",
    objectName: "Duke_2mm",
    b0: "3T",
    nucleus: "1 H",
    frequency: "127.73",
    resolution: "2 mm isotropic",
    numOfTissues: "21",
    coil: "16-Ch 3T Head Surface Coil",
    receiveChannels: 16,
    transmitChannels: 0,
    emSimulator: "MARIE_3.0_WSVIE_version",
    image: "/models/headsurface.jpg",
  },
  {
    id: "2",
    name: "3T Head Birdcage Coil",
    objectName: "Duke_2mm",
    b0: "3T",
    nucleus: "1 H",
    frequency: "127.73",
    resolution: "2 mm isotropic",
    numOfTissues: "21",
    coil: "3T Head Birdcage Coil",
    receiveChannels: 2,
    transmitChannels: 2,
    emSimulator: "MARIE_3.0_WSVIE_version",
    image: "/models/headbirdcage.png",
  },
  {
    id: "3",
    name: "8-Ch 7T Head Triangular Coil",
    objectName: "Duke_2mm",
    b0: "7T",
    nucleus: "1 H",
    frequency: "298.04",
    resolution: "2 mm isotropic",
    numOfTissues: "22",
    coil: "8-Ch 7T Head Triangular Coil",
    receiveChannels: 8,
    transmitChannels: 8,
    emSimulator: "MARIE_3.0_WSVIE_version",
    image: "/models/headtriangular.png",
  },
];

const CAMRIE_PRESET_MODEL_UPLOAD_FILES: UploadedFile[] = CAMRIE_PRESET_MODELS.map((opt, index) => ({
  id: -(index + 1),
  fileName: opt.name,
  link: opt.id,
  location: "local",
  database: "local",
  size: "—",
  status: "local",
  createdAt: "",
  updatedAt: "",
}));

/** Space between Field of View geometry sections via `margin-top` (intro sits flush above Orientation). */
const FOV_GEOMETRY_SECTION_MARGIN_TOP = "2rem";

/** Matches `fovBoundingBoxMesh` rotation clamps (interactive drag + backend). */
const FOV_ANGULATION_DEG_MIN = -89.5;
const FOV_ANGULATION_DEG_MAX = 89.5;

/** Z rotation about slice normal (after LR/AP world tilts). */
const FOV_Z_ANGULATION_DEG_MIN = -180;
const FOV_Z_ANGULATION_DEG_MAX = 180;

/** Slider range for slice offset (mm). Text field still accepts values outside this range. */
const FOV_OFFSET_MM_MIN = -250;
const FOV_OFFSET_MM_MAX = 250;

/** Fixed label column width (`sm+`) so X/Y/Z slider tracks share a common start edge. */
const FOV_ANGLE_LABEL_COL_WIDTH_PX = { sm: 40 };

/** Label column for Translation rows (matches Rotation — both now use single-letter labels). */
const FOV_OFFSET_LABEL_COL_WIDTH_PX = { sm: 40 };

/** Translation + rotation rows: shorter track so inputs stay compact in two-column layout. */
const FOV_ROW_SLIDER_SX = {
  flex: "1 1 88px",
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  color: "#1578A1",
  "& .MuiSlider-thumb": { color: "#1578A1" },
  "& .MuiSlider-track": { color: "#1578A1" },
};

/** Stacked Translation/Rotation (phones & smaller laptops): classic full-width rows. */
const FOV_STACKED_SLIDER_SX = {
  flex: "1 1 120px",
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  color: "#1578A1",
  "& .MuiSlider-thumb": { color: "#1578A1" },
  "& .MuiSlider-track": { color: "#1578A1" },
};

const FOV_OFFSET_LABEL_COL_STACKED_PX = { sm: 40 };

/** Width for rotation (°) numeric fields. */
const FOV_GEOMETRY_NUMERIC_INPUT_WIDTH_PX = 100;
/** Width for translation (mm) numeric fields — slightly wider to comfortably fit negative values. */
const FOV_GEOMETRY_TRANSLATION_INPUT_WIDTH_PX = 120;

/** Parallel Ranges row — compact fields; thickness label is wider. */
const FOV_PARALLEL_RANGES_FIELD_WIDTH_PX = 132;
/** Fits full “Slice thickness (mm)” label on small inputs. */
const FOV_PARALLEL_RANGES_THICKNESS_FIELD_WIDTH_PX = 178;

/** FoV (mm) = resolution (mm/pixel) × number of pixels — user may enter any two; the third is derived on blur. */
type FovTripletBlurredField = "fovMm" | "res" | "pixels";

type ParsedFovTriplet = { fovMm?: number; res?: number; px?: number };

function parseFovTripletStrings(rawFov: string, rawRes: string, rawPx: string): ParsedFovTriplet {
  const fovMm = (() => {
    const t = rawFov.trim();
    if (t === "") return undefined;
    const n = parseFloat(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  })();
  const res = (() => {
    const t = rawRes.trim();
    if (t === "") return undefined;
    const n = parseFloat(t);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();
  const px = (() => {
    const t = rawPx.trim();
    if (t === "") return undefined;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 1 ? n : undefined;
  })();
  return { fovMm, res, px };
}

function resolveFovTriplet(
  t: ParsedFovTriplet,
  lastField: FovTripletBlurredField,
): { fovPixels: number; fovResMM: number } | null {
  const { fovMm, res, px } = t;
  const hasF = fovMm !== undefined;
  const hasR = res !== undefined;
  const hasP = px !== undefined;
  const count = [hasF, hasR, hasP].filter(Boolean).length;
  if (count < 2) return null;

  if (hasP && hasR && !hasF) {
    return { fovPixels: Math.max(1, Math.round(px!)), fovResMM: Math.max(0.01, res!) };
  }
  if (hasF && hasR && !hasP) {
    return {
      fovPixels: Math.max(1, Math.round(fovMm! / res!)),
      fovResMM: Math.max(0.01, res!),
    };
  }
  if (hasF && hasP && !hasR) {
    const fovPixels = Math.max(1, Math.round(px!));
    return { fovPixels, fovResMM: Math.max(0.01, fovMm! / fovPixels) };
  }
  if (hasF && hasR && hasP) {
    const f = fovMm!;
    const r = Math.max(0.01, res!);
    const pRounded = Math.max(1, Math.round(px!));
    if (lastField === "pixels") {
      return { fovPixels: pRounded, fovResMM: Math.max(0.01, f / pRounded) };
    }
    return { fovPixels: Math.max(1, Math.round(f / r)), fovResMM: r };
  }
  return null;
}

/**
 * Which stored field maps to each LR/AP angle row. Internally `angulationLRdeg` / `angulationAPdeg` are rotations about
 * fixed world +x and +y (see `applyWorldAxisAngulation` in fovBoundingBoxMesh). **Z** is rotation about the slice normal
 * (third row). LR/AP labels describe **obliquity the user sees**, not axis names.
 */
type FovAngulationAxisKey = "lr" | "ap";

type FovAngleRowSpec = { label: string; axisKey: FovAngulationAxisKey };

function fovAngleRowsForOrientation(orientation: FovPlaneOrientation): [FovAngleRowSpec, FovAngleRowSpec] {
  switch (orientation) {
    case "axial":
      return [
        { label: "X", axisKey: "lr" },
        { label: "Y", axisKey: "ap" },
      ];
    case "sagittal":
      return [
        { label: "X", axisKey: "ap" },
        { label: "Y", axisKey: "lr" },
      ];
    case "coronal":
      return [
        { label: "X", axisKey: "lr" },
        { label: "Y", axisKey: "ap" },
      ];
    default:
      return [
        { label: "X", axisKey: "lr" },
        { label: "Y", axisKey: "ap" },
      ];
  }
}

const Setup = () => {
  const dispatch = useAppDispatch();
  const { accessToken, uploadToken } = useAppSelector((state) => state.authenticate);
  const dataFiles = useAppSelector((state) => state.data.files);

  const [openModelPanel, setOpenModelPanel] = useState<Array<string | number>>([0]); // open by default
  const [openPulsePanel, setOpenPulsePanel] = useState<Array<string | number>>([]); // closed by default
  const [openFieldofViewPanel, setOpenFieldofViewPanel] = useState<Array<string | number>>([0]); // open by default

  const modelFileSelection = useMemo(() => {
    const serverZips = dataFiles.filter((f) => f.fileName.toLowerCase().endsWith(".zip"));
    return [...CAMRIE_PRESET_MODEL_UPLOAD_FILES, ...serverZips];
  }, [dataFiles]);

  useEffect(() => {
    dispatch(getUploadedData() as never);
  }, [dispatch]);

  const [selectedModel, setSelectedModel] = useState<SetupModelOption | null>(null);
  const [marieZipLoading, setMarieZipLoading] = useState(false);

  const is16chHeadSurface = selectedModel?.name === MODEL_16CH_SURFACE;
  const isBirdcageCoil = selectedModel?.name === MODEL_BIRDCAGE;
  const isTriangularCoil = selectedModel?.name === MODEL_TRIANGULAR;

  const availableVolumes = useMemo((): Record<string, string> => {
    const zipMap = selectedModel?.volumeMapFromZip;
    if (zipMap && Object.keys(zipMap).length > 0) {
      return zipMap;
    }
    if (is16chHeadSurface) {
      return Object.fromEntries(
        Object.entries(SETUP_VOLUME_MAP).map(([name, filename]) => [
          name,
          baseUrlHeadSurfaceCoil + filename,
        ]),
      );
    }
    if (isBirdcageCoil) {
      return Object.fromEntries(
        Object.entries(SETUP_VOLUME_MAP_BIRDCAGE).map(([name, filename]) => [
          name,
          baseUrl3TBirdcageCoil + filename,
        ]),
      );
    }
    if (isTriangularCoil) {
      return Object.fromEntries(
        Object.entries(SETUP_VOLUME_MAP_TRIANGULAR).map(([name, filename]) => [
          name,
          baseUrl7TTriangularCoil + filename,
        ]),
      );
    }
    return {};
  }, [selectedModel?.volumeMapFromZip, is16chHeadSurface, isBirdcageCoil, isTriangularCoil]);

  // NiiVue viewer state (matching Results.tsx)
  const [selectedVolume, setSelectedVolume] = useState(0);
  const [warning, setWarning] = useState("");
  const [warningOpen, setWarningOpen] = useState(false);
  /** Toggle scan / slice overlay (bounding box) on the viewer. */
  const [showFieldOfViewOverlay, setShowFieldOfViewOverlay] = useState(true);
  /** Controlled by the "Translate Slice" / "Rotate Slice" dropdown options in the viewer toolbar. */
  const [fovInteractiveMode, setFovInteractiveMode] = useState<"translate" | "angle" | null>(null);
  /** When set, Alt+Ctrl canvas drag does not change that angle (manual text edits still apply). */
  const [fovInteractiveLockLR, setFovInteractiveLockLR] = useState(false);
  const [fovInteractiveLockAP, setFovInteractiveLockAP] = useState(false);
  /** When set, the Z (in-plane rotation) slider and text field are disabled to prevent accidental changes. */
  const [fovInteractiveLockZ, setFovInteractiveLockZ] = useState(false);
  const [fovMeshOpacity, setFovMeshOpacity] = useState(0.8);
  const theme = useTheme();
  const isFovTranslationAngulationDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  /** Per protocol-sequence id: FoV, orientation, slice stack (viewer edits the active row). */
  const [geometryBySequenceId, setGeometryBySequenceId] = useState<
    Record<string, SequenceGeometryFormState>
  >({});
  /** Draft strings while editing so inputs can be cleared and retyped without immediate clamping. */
  const [fovXMMdraft, setFovXMMdraft] = useState<string | null>(null);
  const [fovPixelsXDraft, setFovPixelsXDraft] = useState<string | null>(null);
  const [fovResXMMDraft, setFovResXMMDraft] = useState<string | null>(null);
  const [fovYMMDraft, setFovYMMDraft] = useState<string | null>(null);
  const [fovPixelsYDraft, setFovPixelsYDraft] = useState<string | null>(null);
  const [fovResYMMDraft, setFovResYMMDraft] = useState<string | null>(null);
  const [sagittalNumSlicesDraft, setSagittalNumSlicesDraft] = useState<string | null>(null);
  const [sagittalThicknessDraft, setSagittalThicknessDraft] = useState<string | null>(null);
  const [sagittalGapDraft, setSagittalGapDraft] = useState<string | null>(null);
  const [sliceOffsetXMmDraft, setSliceOffsetXMmDraft] = useState<string | null>(null);
  const [sliceOffsetYMmDraft, setSliceOffsetYMmDraft] = useState<string | null>(null);
  const [sliceOffsetZMmDraft, setSliceOffsetZMmDraft] = useState<string | null>(null);
  const [fovAngulationLRdraft, setFovAngulationLRdraft] = useState<string | null>(null);
  const [fovAngulationAPdraft, setFovAngulationAPdraft] = useState<string | null>(null);
  const [fovAngulationZDraft, setFovAngulationZDraft] = useState<string | null>(null);

  const commitFovResMm = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (t === "") return fallback;
    const n = parseFloat(t);
    return Number.isFinite(n) ? Math.max(0.01, n) : fallback;
  };

  const commitSliceCount = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (t === "") return fallback;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? Math.max(1, n) : fallback;
  };
  const commitNonNegMm = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (t === "") return fallback;
    const n = parseFloat(t);
    return Number.isFinite(n) ? Math.max(0, n) : fallback;
  };

  /** Signed offset in mm (slice group center vs volume isocenter), rounded to 3 decimal places. */
  const commitSignedMm = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (t === "") return fallback;
    const n = parseFloat(t);
    return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : fallback;
  };

  const commitAngulationDeg = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (t === "") return fallback;
    const n = parseFloat(t);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(FOV_ANGULATION_DEG_MIN, Math.min(FOV_ANGULATION_DEG_MAX, n));
  };

  const commitAngulationZDeg = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (t === "") return fallback;
    const n = parseFloat(t);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(FOV_Z_ANGULATION_DEG_MIN, Math.min(FOV_Z_ANGULATION_DEG_MAX, n));
  };

  /** Physical extents of the loaded volume in millimetres along LR / AP / SI axes. */
  const [loadedVolumeExtentMm, setLoadedVolumeExtentMm] = useState<{
    lrMm: number;
    apMm: number;
    siMm: number;
  } | null>(null);

  useEffect(() => {
    if (Object.keys(availableVolumes).length === 0) {
      setLoadedVolumeExtentMm(null);
      return;
    }
    let cancelled = false;
    const readExtent = (): boolean => {
      try {
        if (nv?.volumes?.[0] && nv.gl) {
          const ext = volumePhysicalExtentMm(nv as Parameters<typeof volumePhysicalExtentMm>[0]);
          if (!cancelled) {
            setLoadedVolumeExtentMm(ext);
          }
          return true;
        }
      } catch {
        /* volume not ready */
      }
      return false;
    };
    if (readExtent()) return () => { cancelled = true; };
    const id = window.setInterval(() => {
      if (readExtent()) window.clearInterval(id);
    }, 250);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [availableVolumes, selectedVolume]);

  /**
   * Default geometry form state seeded from the loaded volume's physical extents.
   * Uses the axial orientation (the form default): fovX = LR extent, fovY = AP extent,
   * at 1 mm/px resolution. Falls back to DEFAULT_SEQUENCE_GEOMETRY_FORM when no volume is loaded.
   */
  const defaultGeometryFromVolume = useMemo((): SequenceGeometryFormState => {
    if (!loadedVolumeExtentMm) return { ...DEFAULT_SEQUENCE_GEOMETRY_FORM };
    const { lrMm, apMm } = loadedVolumeExtentMm;
    const fovXMm = Math.round(lrMm);
    const fovYMm = Math.round(apMm);
    const res = 1;
    return {
      ...DEFAULT_SEQUENCE_GEOMETRY_FORM,
      fovResXMM: res,
      fovResYMM: res,
      fovPixelsX: Math.max(1, Math.round(fovXMm / res)),
      fovPixelsY: Math.max(1, Math.round(fovYMm / res)),
    };
  }, [loadedVolumeExtentMm]);

  // Convert availableVolumes to niis format expected by NiiVue
  const setupNiis = Object.entries(availableVolumes).map(([name, url], index) => ({
    id: index,
    dim: 3,
    name,
    filename: niivueSafeVolumeName(url, `${name}.nii.gz`),
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
      const initialIndex = indexOfPreferredMarieVolume(entries);
      const [name, url] = entries[initialIndex];
      const vol = {
        url,
        name: niivueSafeVolumeName(url, `${name}.nii.gz`),
        alias: name,
      };
      nv.loadVolumes([vol]);
      nv.closeDrawing();
      setSelectedVolume(initialIndex);
      setTimeout(() => nv.resizeListener(), 700);
    } else {
      removeFovBoundingBoxMesh(nv as any);
      nv.loadVolumes([]);
    }
    return () => {
      removeFovBoundingBoxMesh(nv as any);
      nv.loadVolumes([]);
    };
  }, [availableVolumes]);

  const handleModelSelected = (file?: UploadedFile) => {
    void (async () => {
      if (!file) {
        setSelectedModel(null);
        return;
      }

      if (file.location === "local") {
        const match = CAMRIE_PRESET_MODELS.find((opt) => opt.id === file.link);
        setSelectedModel(match ?? null);
        return;
      }

      if (!file.fileName.toLowerCase().endsWith(".zip")) {
        warn("Select a .zip MARIE model archive from storage, or pick a built-in preset.");
        return;
      }

      setMarieZipLoading(true);
      try {
        const locationPayload = JSON.parse(file.location) as unknown;
        const { volumes, card, previewImageLink } = await fetchMarieZipManifest(
          locationPayload,
          file.fileName,
        );
        setSelectedModel({
          id: `zip-${file.id}`,
          name: file.fileName,
          objectName: card.objectName,
          b0: card.b0,
          nucleus: card.nucleus,
          frequency: card.frequency,
          resolution: card.resolution,
          numOfTissues: card.numOfTissues,
          coil: card.coil,
          receiveChannels: card.receiveChannels,
          transmitChannels: card.transmitChannels,
          emSimulator: card.emSimulator,
          image: previewImageLink ?? "/models/headsurface.jpg",
          volumeMapFromZip: volumes,
        });
      } catch (e) {
        console.error(e);
        const detail = e instanceof Error ? e.message : String(e);
        warn(
          detail
            ? `Could not load MARIE zip: ${detail}`
            : "Could not load MARIE zip from the server. The `/unzip` response must include volume links and `info` from info.json (see marieZipManifest.ts).",
        );
        setSelectedModel(null);
      } finally {
        setMarieZipLoading(false);
      }
    })();
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
  type SavedProtocol = {
    id: string;
    label: string;
    sequenceIds: string[];
    /** Per-sequence geometry snapshots at last save (one entry per protocol sequence id). */
    sequenceGeometry?: Record<string, SequenceGeometryJson | LegacySequenceGeometryJson>;
  };
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
          Array.isArray((p as SavedProtocol).sequenceIds) &&
          ((p as SavedProtocol).sequenceGeometry === undefined ||
            (typeof (p as SavedProtocol).sequenceGeometry === "object" &&
              (p as SavedProtocol).sequenceGeometry !== null))
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
      setGeometryBySequenceId({});
      return;
    }

    if (value === "10") {
      const loaded = PROTOCOL_1_SEQUENCE_IDS
        .map((id) => getSequenceById(id))
        .filter((s): s is typeof sequenceOptions[number] => Boolean(s));

      setProtocolSequences(loaded);
      setGeometryBySequenceId(
        Object.fromEntries(loaded.map((s) => [s.id, { ...defaultGeometryFromVolume }])),
      );

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

      const geom: Record<string, SequenceGeometryFormState> = {};
      for (const s of loaded) {
        const g = saved.sequenceGeometry?.[s.id];
        geom[s.id] = g ? sequenceGeometryJsonToFormState(g) : { ...defaultGeometryFromVolume };
      }
      setGeometryBySequenceId(geom);

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
    setGeometryBySequenceId({});
    setSelectedSequence(null);
    setSelectedProtocolSeqId(null);
  };

  const modelZipUploadHandler = uploadHandlerFactory(uploadToken, dispatch, uploadData);

  const noopUploadHandler = async (
    file: File,
    fileAlias: string,
    fileDatabase: string,
    onProgress?: (progress: number) => void,
    onUploaded?: (res: AxiosResponse<any, any, {}>, file: File) => void,
  ): Promise<number> => {
    onProgress?.(100);
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

    setGeometryBySequenceId((prev) => ({
      ...prev,
      [selectedSequence.id]: prev[selectedSequence.id] ?? { ...defaultGeometryFromVolume },
    }));

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
    setSelectedProtocolSeqId((cur) => (cur === id ? null : cur));

    setGeometryBySequenceId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

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
    setSelectedProtocolSeqId((cur) =>
      cur != null && idsToDelete.includes(cur) ? null : cur,
    );

    setGeometryBySequenceId((prev) => {
      const next = { ...prev };
      idsToDelete.forEach((id) => delete next[id]);
      return next;
    });

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

  const [backendPayloadDialogOpen, setBackendPayloadDialogOpen] = useState(false);
  const [backendPayloadText, setBackendPayloadText] = useState("");
  const [backendPayloadError, setBackendPayloadError] = useState<string | null>(null);

  const handleSaveProtocolClick = () => {
    // Saved protocol: update in place, no dialog
    if (protocol.startsWith("saved-")) {
      const ids = protocolSequences.map((s) => s.id);
      const sequenceGeometry = Object.fromEntries(
        ids.map((id) => [id, captureSequenceGeometryForId(id)]),
      );
      setSavedProtocols((prev) =>
        prev.map((p) =>
          p.id === protocol ? { ...p, sequenceIds: ids, sequenceGeometry } : p
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

    const ids = protocolSequences.map((s) => s.id);
    const sequenceGeometry = Object.fromEntries(
      ids.map((id) => [id, captureSequenceGeometryForId(id)]),
    );

    const newProtocol: SavedProtocol = {
      id: `saved-${Date.now()}`,
      label: name,
      sequenceIds: ids,
      sequenceGeometry,
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
  const isBuiltInProtocol123 =
    protocol === "10" || protocol === "20" || protocol === "30";

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
      setGeometryBySequenceId({});
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

  const viewerSequenceId = selectedProtocolSeqId;

  const activeForm: SequenceGeometryFormState = useMemo(() => {
    if (!viewerSequenceId) return DEFAULT_SEQUENCE_GEOMETRY_FORM;
    return {
      ...DEFAULT_SEQUENCE_GEOMETRY_FORM,
      ...geometryBySequenceId[viewerSequenceId],
    };
  }, [viewerSequenceId, geometryBySequenceId]);

  const fovAngleRows = useMemo(
    () => fovAngleRowsForOrientation(activeForm.orientation),
    [activeForm.orientation],
  );

  const encodingDirectionChoices = useMemo(
    () => ENCODING_DIRECTION_OPTIONS[activeForm.orientation],
    [activeForm.orientation],
  );

  useEffect(() => {
    setFovXMMdraft(null);
    setFovPixelsXDraft(null);
    setFovResXMMDraft(null);
    setFovYMMDraft(null);
    setFovPixelsYDraft(null);
    setFovResYMMDraft(null);
    setSagittalNumSlicesDraft(null);
    setSagittalThicknessDraft(null);
    setSagittalGapDraft(null);
    setSliceOffsetXMmDraft(null);
    setSliceOffsetYMmDraft(null);
    setSliceOffsetZMmDraft(null);
    setFovAngulationLRdraft(null);
    setFovAngulationAPdraft(null);
    setFovAngulationZDraft(null);
  }, [viewerSequenceId]);

  useEffect(() => {
    setGeometryBySequenceId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const s of protocolSequences) {
        if (next[s.id] === undefined) {
          next[s.id] = { ...defaultGeometryFromVolume };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [protocolSequences, defaultGeometryFromVolume]);

  const sequenceFovXMM = useMemo(
    () => Math.max(0, Math.round(activeForm.fovPixelsX) * activeForm.fovResXMM),
    [activeForm.fovPixelsX, activeForm.fovResXMM],
  );
  const sequenceFovYMM = useMemo(
    () => Math.max(0, Math.round(activeForm.fovPixelsY) * activeForm.fovResYMM),
    [activeForm.fovPixelsY, activeForm.fovResYMM],
  );

  const captureSequenceGeometryForId = useCallback(
    (sequenceId: string): SequenceGeometryJson => {
      let isocenter: [number, number, number] | null = null;
      try {
        const p = getSliceCenterMmForGeometryExport(nv);
        if (p) isocenter = [p[0], p[1], p[2]];
      } catch {
        /* volume not ready */
      }
      const form = geometryBySequenceId[sequenceId] ?? DEFAULT_SEQUENCE_GEOMETRY_FORM;
      return buildSequenceGeometryJson(formStateToCaptureInput(form, isocenter));
    },
    [geometryBySequenceId],
  );

  const handleOpenBackendPayloadPreview = useCallback(() => {
    try {
      const geometryById = Object.fromEntries(
        protocolSequences.map((s) => [s.id, captureSequenceGeometryForId(s.id)]),
      );
      const payload = buildBackendSequencesPayload(
        protocolSequences.map((s) => ({ id: s.id, fileName: s.fileName ?? s.id })),
        geometryById,
      );
      setBackendPayloadText(JSON.stringify(payload, null, 2));
      setBackendPayloadError(null);
    } catch (err) {
      setBackendPayloadText("");
      setBackendPayloadError(err instanceof Error ? err.message : String(err));
    }
    setBackendPayloadDialogOpen(true);
  }, [protocolSequences, captureSequenceGeometryForId]);

  const patchActiveSequenceGeometry = useCallback(
    (patch: Partial<SequenceGeometryFormState>) => {
      const id = selectedProtocolSeqId;
      if (!id) return;
      setGeometryBySequenceId((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? DEFAULT_SEQUENCE_GEOMETRY_FORM), ...patch },
      }));
    },
    [selectedProtocolSeqId],
  );

  const onBlurPhaseEncodingTriplet = useCallback(
    (lastField: FovTripletBlurredField) => {
      const rawFov = fovXMMdraft ?? sequenceFovXMM.toFixed(2);
      const rawRes = fovResXMMDraft ?? String(activeForm.fovResXMM);
      const rawPx = fovPixelsXDraft ?? String(activeForm.fovPixelsX);
      const out = resolveFovTriplet(parseFovTripletStrings(rawFov, rawRes, rawPx), lastField);
      setFovXMMdraft(null);
      setFovResXMMDraft(null);
      setFovPixelsXDraft(null);
      if (out) patchActiveSequenceGeometry({ fovPixelsX: out.fovPixels, fovResXMM: out.fovResMM });
    },
    [
      patchActiveSequenceGeometry,
      fovXMMdraft,
      fovResXMMDraft,
      fovPixelsXDraft,
      sequenceFovXMM,
      activeForm.fovResXMM,
      activeForm.fovPixelsX,
    ],
  );

  const onBlurFrequencyEncodingTriplet = useCallback(
    (lastField: FovTripletBlurredField) => {
      const rawFov = fovYMMDraft ?? sequenceFovYMM.toFixed(2);
      const rawRes = fovResYMMDraft ?? String(activeForm.fovResYMM);
      const rawPx = fovPixelsYDraft ?? String(activeForm.fovPixelsY);
      const out = resolveFovTriplet(parseFovTripletStrings(rawFov, rawRes, rawPx), lastField);
      setFovYMMDraft(null);
      setFovResYMMDraft(null);
      setFovPixelsYDraft(null);
      if (out) patchActiveSequenceGeometry({ fovPixelsY: out.fovPixels, fovResYMM: out.fovResMM });
    },
    [
      patchActiveSequenceGeometry,
      fovYMMDraft,
      fovResYMMDraft,
      fovPixelsYDraft,
      sequenceFovYMM,
      activeForm.fovResYMM,
      activeForm.fovPixelsY,
    ],
  );

  /** Alt+Ctrl+drag on FoV canvas: LR/AP only (±89.5°), about world +x / +y; Z unchanged. */
  const handleFovAngulationSetDeg = useCallback(
    (angulationLRdeg: number, angulationAPdeg: number) => {
      setFovAngulationLRdraft(null);
      setFovAngulationAPdraft(null);
      setFovAngulationZDraft(null);
      patchActiveSequenceGeometry({ angulationLRdeg, angulationAPdeg });
    },
    [patchActiveSequenceGeometry],
  );

  /** Alt+drag translation: keep offset fields in sync with the mesh (mm along +x left, +y posterior, +z head). */
  const handleFovSliceOffsetMmChange = useCallback(
    (offsetWorldMm: [number, number, number]) => {
      setSliceOffsetXMmDraft(null);
      setSliceOffsetYMmDraft(null);
      setSliceOffsetZMmDraft(null);
      const r = (v: number) => Math.round(v * 1000) / 1000;
      patchActiveSequenceGeometry({
        sliceOffsetXMM: r(offsetWorldMm[0]),
        sliceOffsetYMM: r(offsetWorldMm[1]),
        sliceOffsetZMM: r(offsetWorldMm[2]),
      });
    },
    [patchActiveSequenceGeometry],
  );

  const setupFovBoxOptions = useMemo(
    () => ({
      scale: 1,
      axialFovMm: { fovXMm: sequenceFovXMM, fovYMm: sequenceFovYMM },
      imagePrescription: {
        orientation: activeForm.orientation,
        angulationLRdeg: activeForm.angulationLRdeg,
        angulationAPdeg: activeForm.angulationAPdeg,
        angulationZDeg: activeForm.angulationZDeg,
      },
      sliceOffsetWorldMm: [
        activeForm.sliceOffsetXMM,
        activeForm.sliceOffsetYMM,
        activeForm.sliceOffsetZMM,
      ] as [number, number, number],
      axialSliceStack: {
        numSlices: Math.max(1, Math.round(activeForm.sagittalNumSlices)),
        sliceThicknessMm: Math.max(0.01, activeForm.sagittalSliceThicknessMm),
        sliceGapMm: Math.max(0, (activeForm.sagittalSliceGapPct / 100) * activeForm.sagittalSliceThicknessMm),
      },
      rgba255: [57, 255, 20, 255] as [number, number, number, number],
      opacity: fovMeshOpacity,
      name: "Axial FOV",
      fovInteractive: {
        enabled: fovInteractiveMode !== null,
        altFree: fovInteractiveMode !== null,
        onAngulationSetDeg: handleFovAngulationSetDeg,
        onSliceOffsetMmChange: handleFovSliceOffsetMmChange,
        lockAngulationLR: fovInteractiveMode === "translate" || fovInteractiveLockLR,
        lockAngulationAP: fovInteractiveMode === "translate" || fovInteractiveLockAP,
        lockTranslate: fovInteractiveMode === "angle",
      },
    }),
    [
      sequenceFovXMM,
      sequenceFovYMM,
      activeForm.orientation,
      activeForm.angulationLRdeg,
      activeForm.angulationAPdeg,
      activeForm.angulationZDeg,
      activeForm.sliceOffsetXMM,
      activeForm.sliceOffsetYMM,
      activeForm.sliceOffsetZMM,
      activeForm.sagittalNumSlices,
      activeForm.sagittalSliceThicknessMm,
      activeForm.sagittalSliceGapPct,
      fovInteractiveMode,
      fovInteractiveLockLR,
      fovInteractiveLockAP,
      fovMeshOpacity,
      handleFovAngulationSetDeg,
      handleFovSliceOffsetMmChange,
    ],
  );

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

    setGeometryBySequenceId((prev) => ({
      ...prev,
      [newId]: { ...(prev[seq.id] ?? DEFAULT_SEQUENCE_GEOMETRY_FORM) },
    }));

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
                        fileSelection={modelFileSelection}
                        onSelected={handleModelSelected}
                        onUploaded={() => {
                          dispatch(getUploadedData() as never);
                        }}
                        chosenFile={selectedModel?.name}
                        maxCount={1}
                        preprocess={preprocessMarieModelZip}
                        uploadHandler={modelZipUploadHandler}
                        buttonText="Choose"
                        selectStyles={selectStyles}
                      />

                      {marieZipLoading && (
                        <CircularProgress size={22} sx={{ color: "#1578a1" }} />
                      )}

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
              <Box sx={{ pt: 3, pb: 3 }}>
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

                        <Typography><strong>FA:</strong>&nbsp;{Array.isArray(selectedSequence.fa) ? selectedSequence.fa.join(' - ') : selectedSequence.fa}</Typography>
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
                          flexDirection: "column",
                          gap: 1.5,
                          width: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.5,
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
                            aria-label={
                              isBuiltInProtocol123 ? "Save protocol as" : "Save protocol"
                            }
                          >
                            {isBuiltInProtocol123 ? "Save As" : "Save"}
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
                        <CmrButton
                          variant="outlined"
                          onClick={handleOpenBackendPayloadPreview}
                          disabled={protocolSequences.length === 0}
                          sx={{ width: "100%" }}
                        >
                          View backend JSON
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
              <CmrPanel header="Field of View">
                <Box
                  sx={{
                    pb: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    px: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      maxWidth: "100%",
                      minWidth: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    {protocolSequences.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Add sequences to the protocol to set slice selection and FoV per sequence
                      </Typography>
                    ) : !selectedProtocolSeqId ? (
                      <Typography variant="body2" color="text.secondary">
                        Select a sequence in the protocol to set slice selection and FoV per sequence
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Editing:{" "}
                          <strong>
                            {protocolSequences.find((s) => s.id === viewerSequenceId)?.alias ?? "—"}
                          </strong>
                        </Typography>
                        <Box sx={{ marginTop: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                       Slice Orientation 
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-end" }}>
                        <FormControl size="small" sx={{ minWidth: 220 }} disabled={protocolSequences.length === 0}>
                          <InputLabel id="fov-orientation-label">Slice Orientation</InputLabel>
                          <MuiSelect
                            labelId="fov-orientation-label"
                            label="Slice Orientation"
                            value={activeForm.orientation}
                            onChange={(e) => {
                              const next = e.target.value as FovPlaneOrientation;
                              patchActiveSequenceGeometry({
                                orientation: next,
                                phaseEncodingDirection: activeForm.phaseEncodingDirection
                                  ? clampEncodingDirectionToOrientation(next, activeForm.phaseEncodingDirection)
                                  : null,
                                frequencyEncodingDirection: activeForm.frequencyEncodingDirection
                                  ? clampEncodingDirectionToOrientation(next, activeForm.frequencyEncodingDirection)
                                  : null,
                              });
                            }}
                          >
                            <MenuItem value="axial">Axial</MenuItem>
                            <MenuItem value="sagittal">Sagittal</MenuItem>
                            <MenuItem value="coronal">Coronal</MenuItem>
                          </MuiSelect>
                        </FormControl>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        marginTop: FOV_GEOMETRY_SECTION_MARGIN_TOP,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                          Phase Encoding
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-end" }}>
                          <TextField
                            label="FoV (mm)"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={fovXMMdraft !== null ? fovXMMdraft : sequenceFovXMM}
                            onFocus={() => setFovXMMdraft((d) => d ?? String(sequenceFovXMM))}
                            onChange={(e) => setFovXMMdraft(e.target.value)}
                            onBlur={() => onBlurPhaseEncodingTriplet("fovMm")}
                            inputProps={{ step: "any" }}
                            sx={{ width: 160 }}
                          />
                          <TextField
                            label="Resolution (mm/pixel)"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={fovResXMMDraft !== null ? fovResXMMDraft : activeForm.fovResXMM}
                            onFocus={() => setFovResXMMDraft((d) => d ?? String(activeForm.fovResXMM))}
                            onChange={(e) => setFovResXMMDraft(e.target.value)}
                            onBlur={() => onBlurPhaseEncodingTriplet("res")}
                            inputProps={{ step: "any" }}
                            sx={{ width: 160 }}
                          />
                          <TextField
                            label="Number of pixels"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={fovPixelsXDraft !== null ? fovPixelsXDraft : activeForm.fovPixelsX}
                            onFocus={() => setFovPixelsXDraft((d) => d ?? String(activeForm.fovPixelsX))}
                            onChange={(e) => setFovPixelsXDraft(e.target.value)}
                            onBlur={() => onBlurPhaseEncodingTriplet("pixels")}
                            inputProps={{ step: "any" }}
                            sx={{ width: 160 }}
                          />
                          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.25 }}>
                            <FormControl size="small" sx={{ minWidth: 220 }} disabled={protocolSequences.length === 0}>
                              <InputLabel id="fov-phase-encoding-direction-label" shrink>Direction</InputLabel>
                              <MuiSelect
                                labelId="fov-phase-encoding-direction-label"
                                label="Direction"
                                displayEmpty
                                value={activeForm.phaseEncodingDirection ?? ""}
                                onChange={(e) => {
                                  const next = e.target.value as EncodingDirectionId;
                                  const conflictsWithFreq =
                                    activeForm.frequencyEncodingDirection !== null &&
                                    areEncodingDirectionsOnSameAnatomicalAxis(next, activeForm.frequencyEncodingDirection);
                                  patchActiveSequenceGeometry({
                                    phaseEncodingDirection: next,
                                    ...(conflictsWithFreq ? { frequencyEncodingDirection: null } : {}),
                                  });
                                }}
                              >
                                <MenuItem value="" disabled sx={{ fontStyle: "italic", color: "text.secondary" }}>
                                  Select
                                </MenuItem>
                                {encodingDirectionChoices.map((opt) => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </MuiSelect>
                            </FormControl>
                            <Tooltip title="Phase encoding axis">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label="About phase encoding direction"
                                  disabled={protocolSequences.length === 0}
                                  tabIndex={protocolSequences.length === 0 ? -1 : 0}
                                  sx={{ color: "text.secondary", mb: 0.25 }}
                                >
                                  <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                          Frequency Encoding
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-end" }}>
                          <TextField
                            label="FoV (mm)"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={fovYMMDraft !== null ? fovYMMDraft : sequenceFovYMM}
                            onFocus={() => setFovYMMDraft((d) => d ?? String(sequenceFovYMM))}
                            onChange={(e) => setFovYMMDraft(e.target.value)}
                            onBlur={() => onBlurFrequencyEncodingTriplet("fovMm")}
                            inputProps={{ step: "any" }}
                            sx={{ width: 160 }}
                          />
                          <TextField
                            label="Resolution (mm/pixel)"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={fovResYMMDraft !== null ? fovResYMMDraft : activeForm.fovResYMM}
                            onFocus={() => setFovResYMMDraft((d) => d ?? String(activeForm.fovResYMM))}
                            onChange={(e) => setFovResYMMDraft(e.target.value)}
                            onBlur={() => onBlurFrequencyEncodingTriplet("res")}
                            inputProps={{ step: "any" }}
                            sx={{ width: 160 }}
                          />
                          <TextField
                            label="Number of pixels"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={fovPixelsYDraft !== null ? fovPixelsYDraft : activeForm.fovPixelsY}
                            onFocus={() => setFovPixelsYDraft((d) => d ?? String(activeForm.fovPixelsY))}
                            onChange={(e) => setFovPixelsYDraft(e.target.value)}
                            onBlur={() => onBlurFrequencyEncodingTriplet("pixels")}
                            inputProps={{ step: "any" }}
                            sx={{ width: 160 }}
                          />
                          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.25 }}>
                            <FormControl size="small" sx={{ minWidth: 220 }} disabled={protocolSequences.length === 0}>
                              <InputLabel id="fov-frequency-encoding-direction-label" shrink>Direction</InputLabel>
                              <MuiSelect
                                labelId="fov-frequency-encoding-direction-label"
                                label="Direction"
                                displayEmpty
                                value={activeForm.frequencyEncodingDirection ?? ""}
                                onChange={(e) => {
                                  const next = e.target.value as EncodingDirectionId;
                                  const conflictsWithPhase =
                                    activeForm.phaseEncodingDirection !== null &&
                                    areEncodingDirectionsOnSameAnatomicalAxis(next, activeForm.phaseEncodingDirection);
                                  patchActiveSequenceGeometry({
                                    frequencyEncodingDirection: next,
                                    ...(conflictsWithPhase ? { phaseEncodingDirection: null } : {}),
                                  });
                                }}
                              >
                                <MenuItem value="" disabled sx={{ fontStyle: "italic", color: "text.secondary" }}>
                                  Select
                                </MenuItem>
                                {encodingDirectionChoices.map((opt) => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </MuiSelect>
                            </FormControl>
                            <Tooltip title="Frequency encoding axis">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label="About frequency encoding direction"
                                  disabled={protocolSequences.length === 0}
                                  tabIndex={protocolSequences.length === 0 ? -1 : 0}
                                  sx={{ color: "text.secondary", mb: 0.25 }}
                                >
                                  <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    {isFovTranslationAngulationDesktop ? (
                    <Box
                      sx={{
                        marginTop: FOV_GEOMETRY_SECTION_MARGIN_TOP,
                        display: "flex",
                        flexDirection: "row",
                        gap: 0,
                        alignItems: "flex-start",
                        width: "100%",
                      }}
                    >
                      <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                        Translation
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          mb: 2,
                        }}
                      >
                        {(
                          [
                            { label: "X", draft: sliceOffsetXMmDraft, setDraft: setSliceOffsetXMmDraft, committed: activeForm.sliceOffsetXMM, field: "sliceOffsetXMM" as const },
                            { label: "Y", draft: sliceOffsetYMmDraft, setDraft: setSliceOffsetYMmDraft, committed: activeForm.sliceOffsetYMM, field: "sliceOffsetYMM" as const },
                            { label: "Z", draft: sliceOffsetZMmDraft, setDraft: setSliceOffsetZMmDraft, committed: activeForm.sliceOffsetZMM, field: "sliceOffsetZMM" as const },
                          ] as const
                        ).map(({ label, draft, setDraft, committed, field }) => (
                          <Box
                            key={label}
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              alignItems: { xs: "stretch", sm: "center" },
                              flexWrap: "nowrap",
                              gap: 1.5,
                              width: "100%",
                              maxWidth: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                            }}
                          >
                            <Typography
                              variant="body2"
                              component="div"
                              sx={{
                                flexShrink: 0,
                                boxSizing: "border-box",
                                width: { xs: "100%", ...FOV_OFFSET_LABEL_COL_WIDTH_PX },
                                minWidth: { xs: 0, ...FOV_OFFSET_LABEL_COL_WIDTH_PX },
                                maxWidth: { xs: "100%", ...FOV_OFFSET_LABEL_COL_WIDTH_PX },
                                pr: { sm: 0.5 },
                                lineHeight: 1.35,
                              }}
                            >
                              {label}:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: { xs: "flex-start", sm: "space-between" },
                                gap: { xs: 1.5, sm: 2 },
                                flex: "1 1 0",
                                flexWrap: "wrap",
                                minWidth: 0,
                                width: { xs: "100%", sm: "auto" },
                                maxWidth: "100%",
                                boxSizing: "border-box",
                              }}
                            >
                              <Slider
                                size="medium"
                                disabled={protocolSequences.length === 0}
                                value={committed}
                                min={FOV_OFFSET_MM_MIN}
                                max={FOV_OFFSET_MM_MAX}
                                step={0.5}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => `${v} mm`}
                                getAriaValueText={(v) => `${v} mm`}
                                onChange={(_, v) => {
                                  const num = typeof v === "number" ? v : v[0];
                                  setDraft(null);
                                  patchActiveSequenceGeometry({ [field]: num });
                                }}
                                sx={FOV_ROW_SLIDER_SX}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  flexShrink: 0,
                                  flexWrap: "wrap",
                                  minWidth: 0,
                                }}
                              >
                                <TextField
                                  type="text"
                                  inputMode="decimal"
                                  size="small"
                                  disabled={protocolSequences.length === 0}
                                  value={draft !== null ? draft : String(committed)}
                                  onFocus={() => setDraft(String(committed))}
                                  onChange={(e) => setDraft(e.target.value)}
                                  onBlur={() => {
                                    patchActiveSequenceGeometry({
                                      [field]: commitSignedMm(draft ?? "", committed),
                                    });
                                    setDraft(null);
                                  }}
                                  sx={{ width: FOV_GEOMETRY_TRANSLATION_INPUT_WIDTH_PX, flexShrink: 0, mr: 0 }}
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end" sx={{ ml: 0.5 }}>
                                        mm
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                          mt: 1,
                        }}
                      >
                        <Tooltip title="Place the slice group center back on the volume isocenter">
                          <span>
                            <CmrButton
                              variant="outlined"
                              size="small"
                              disabled={!nv?.volumes?.[0]}
                              onClick={() => {
                                patchActiveSequenceGeometry({
                                  sliceOffsetXMM: 0,
                                  sliceOffsetYMM: 0,
                                  sliceOffsetZMM: 0,
                                });
                                try {
                                  resetFovSliceTranslation(nv);
                                } catch {
                                  /* volume not ready */
                                }
                              }}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              Reset Translation
                            </CmrButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title="Slice offset from volume isocenter (mm) for the central slice of the stack. LR (left-right): +x toward left. AP (anterior-posterior): +y toward posterior. FH (foot-head): +z toward head. Patient-fixed frame, head-first."
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              aria-label="About slice offset from isocenter"
                              disabled={protocolSequences.length === 0}
                              tabIndex={protocolSequences.length === 0 ? -1 : 0}
                              sx={{ color: "text.secondary" }}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                      </Box>
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          display: { xs: "none", lg: "block" },
                          mx: 3,
                          borderColor: "rgba(0, 0, 0, 0.35)",
                          borderRightWidth: 1.5,
                        }}
                      />
                      <Divider
                        sx={{
                          display: { xs: "block", lg: "none" },
                          width: "100%",
                          my: 2,
                          borderColor: "rgba(0, 0, 0, 0.35)",
                          borderBottomWidth: 1.5,
                        }}
                      />
                      <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                        Rotation
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                        }}
                      >
                        {fovAngleRows.map((row, index) => {
                          const isLr = row.axisKey === "lr";
                          const committedDeg = isLr
                            ? activeForm.angulationLRdeg
                            : activeForm.angulationAPdeg;
                          return (
                            <Box
                              key={`${row.axisKey}-${index}`}
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                alignItems: { xs: "stretch", sm: "center" },
                                flexWrap: "nowrap",
                                gap: 1.5,
                                width: "100%",
                                maxWidth: "100%",
                                minWidth: 0,
                                boxSizing: "border-box",
                              }}
                            >
                              <Typography
                                variant="body2"
                                component="div"
                                sx={{
                                  flexShrink: 0,
                                  boxSizing: "border-box",
                                  width: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                  minWidth: { xs: 0, ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                  maxWidth: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                  pr: { sm: 0.5 },
                                  lineHeight: 1.35,
                                }}
                              >
                                {row.label}:
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: { xs: "flex-start", sm: "space-between" },
                                  gap: { xs: 1.5, sm: 2 },
                                  flex: "1 1 0",
                                  flexWrap: "wrap",
                                  minWidth: 0,
                                  width: { xs: "100%", sm: "auto" },
                                  maxWidth: "100%",
                                  boxSizing: "border-box",
                                }}
                              >
                                <Slider
                                  size="medium"
                                  disabled={protocolSequences.length === 0}
                                  value={committedDeg}
                                  min={FOV_ANGULATION_DEG_MIN}
                                  max={FOV_ANGULATION_DEG_MAX}
                                  step={0.1}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={(v) => `${v}°`}
                                  getAriaValueText={(v) => `${v} degrees`}
                                  onChange={(_, v) => {
                                    const num = typeof v === "number" ? v : v[0];
                                    if (isLr) {
                                      setFovAngulationLRdraft(null);
                                      patchActiveSequenceGeometry({ angulationLRdeg: num });
                                    } else {
                                      setFovAngulationAPdraft(null);
                                      patchActiveSequenceGeometry({ angulationAPdeg: num });
                                    }
                                  }}
                                  sx={FOV_ROW_SLIDER_SX}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    flexShrink: 0,
                                    flexWrap: "wrap",
                                    minWidth: 0,
                                  }}
                                >
                                  <TextField
                                    type="text"
                                    inputMode="decimal"
                                    size="small"
                                    disabled={protocolSequences.length === 0}
                                    value={
                                      isLr
                                        ? fovAngulationLRdraft !== null
                                          ? fovAngulationLRdraft
                                          : String(committedDeg)
                                        : fovAngulationAPdraft !== null
                                          ? fovAngulationAPdraft
                                          : String(committedDeg)
                                    }
                                    onFocus={() =>
                                      isLr
                                        ? setFovAngulationLRdraft(String(activeForm.angulationLRdeg))
                                        : setFovAngulationAPdraft(String(activeForm.angulationAPdeg))
                                    }
                                    onChange={(e) =>
                                      isLr
                                        ? setFovAngulationLRdraft(e.target.value)
                                        : setFovAngulationAPdraft(e.target.value)
                                    }
                                    onBlur={() => {
                                      if (isLr) {
                                        patchActiveSequenceGeometry({
                                          angulationLRdeg: commitAngulationDeg(
                                            fovAngulationLRdraft ?? "",
                                            activeForm.angulationLRdeg,
                                          ),
                                        });
                                        setFovAngulationLRdraft(null);
                                      } else {
                                        patchActiveSequenceGeometry({
                                          angulationAPdeg: commitAngulationDeg(
                                            fovAngulationAPdraft ?? "",
                                            activeForm.angulationAPdeg,
                                          ),
                                        });
                                        setFovAngulationAPdraft(null);
                                      }
                                    }}
                                    sx={{ width: FOV_GEOMETRY_NUMERIC_INPUT_WIDTH_PX, flexShrink: 0 }}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">°</InputAdornment>
                                      ),
                                    }}
                                  />
                                  {/* TEMP: rotation Lock checkboxes — restore when needed
                                  <Box sx={{ "& .MuiFormControlLabel-root": { margin: 0 } }}>
                                    <CmrCheckbox
                                      id={isLr ? "fov-lock-lr-angulation" : "fov-lock-ap-angulation"}
                                      checked={isLr ? fovInteractiveLockLR : fovInteractiveLockAP}
                                      checkedColor="#1578A1"
                                      disabled={protocolSequences.length === 0}
                                      onChange={(e) =>
                                        isLr
                                          ? setFovInteractiveLockLR(e.target.checked)
                                          : setFovInteractiveLockAP(e.target.checked)
                                      }
                                    >
                                      Lock
                                    </CmrCheckbox>
                                  </Box>
                                  */}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            flexWrap: "nowrap",
                            gap: 1.5,
                            width: "100%",
                            maxWidth: "100%",
                            minWidth: 0,
                            boxSizing: "border-box",
                          }}
                        >
                          <Box
                            sx={{
                              flexShrink: 0,
                              boxSizing: "border-box",
                              width: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                              minWidth: { xs: 0, ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                              maxWidth: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                              pr: { sm: 0.5 },
                              lineHeight: 1.35,
                              display: "flex",
                              alignItems: "center",
                              alignSelf: { xs: "stretch", sm: "center" },
                              gap: 0.5,
                            }}
                          >
                            <Typography variant="body2" component="div">
                              Z:
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: { xs: "flex-start", sm: "space-between" },
                              gap: { xs: 1.5, sm: 2 },
                              flex: "1 1 0",
                              flexWrap: "wrap",
                              minWidth: 0,
                              width: { xs: "100%", sm: "auto" },
                              maxWidth: "100%",
                              boxSizing: "border-box",
                            }}
                          >
                            <Slider
                              size="medium"
                              disabled={protocolSequences.length === 0 || fovInteractiveLockZ}
                              value={activeForm.angulationZDeg}
                              min={FOV_Z_ANGULATION_DEG_MIN}
                              max={FOV_Z_ANGULATION_DEG_MAX}
                              step={0.1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(v) => `${v}°`}
                              getAriaValueText={(v) => `${v} degrees`}
                              onChange={(_, v) => {
                                const num = typeof v === "number" ? v : v[0];
                                setFovAngulationZDraft(null);
                                patchActiveSequenceGeometry({ angulationZDeg: num });
                              }}
                              sx={FOV_ROW_SLIDER_SX}
                            />
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                flexShrink: 0,
                                flexWrap: "wrap",
                                minWidth: 0,
                              }}
                            >
                              <TextField
                                type="text"
                                inputMode="decimal"
                                size="small"
                                disabled={protocolSequences.length === 0 || fovInteractiveLockZ}
                                value={
                                  fovAngulationZDraft !== null
                                    ? fovAngulationZDraft
                                    : String(activeForm.angulationZDeg)
                                }
                                onFocus={() =>
                                  setFovAngulationZDraft(String(activeForm.angulationZDeg))
                                }
                                onChange={(e) => setFovAngulationZDraft(e.target.value)}
                                onBlur={() => {
                                  patchActiveSequenceGeometry({
                                    angulationZDeg: commitAngulationZDeg(
                                      fovAngulationZDraft ?? "",
                                      activeForm.angulationZDeg,
                                    ),
                                  });
                                  setFovAngulationZDraft(null);
                                }}
                                sx={{ width: FOV_GEOMETRY_NUMERIC_INPUT_WIDTH_PX, flexShrink: 0 }}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">°</InputAdornment>
                                  ),
                                }}
                              />
                              {/* TEMP: rotation Z Lock — restore when needed
                              <Box sx={{ "& .MuiFormControlLabel-root": { margin: 0 } }}>
                                <CmrCheckbox
                                  id="fov-lock-z-angulation"
                                  checked={fovInteractiveLockZ}
                                  checkedColor="#1578A1"
                                  disabled={protocolSequences.length === 0}
                                  onChange={(e) => setFovInteractiveLockZ(e.target.checked)}
                                >
                                  Lock
                                </CmrCheckbox>
                              </Box>
                              */}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                          mt: 1,
                        }}
                      >
                        <Tooltip title="Set rotation angles back to zero">
                          <span>
                            <CmrButton
                              variant="outlined"
                              size="small"
                              disabled={!nv?.volumes?.[0]}
                              onClick={() => {
                                setFovAngulationLRdraft(null);
                                setFovAngulationAPdraft(null);
                                setFovAngulationZDraft(null);
                                patchActiveSequenceGeometry({
                                  angulationLRdeg: 0,
                                  angulationAPdeg: 0,
                                  angulationZDeg: 0,
                                });
                              }}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              Reset Rotation
                            </CmrButton>
                          </span>
                        </Tooltip>
                      </Box>
                      </Box>
                    </Box>
                    ) : (
                    <Box
                      sx={{
                        marginTop: FOV_GEOMETRY_SECTION_MARGIN_TOP,
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                        Translation
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          mb: 2,
                        }}
                      >
                        {(
                          [
                            { label: "X", draft: sliceOffsetXMmDraft, setDraft: setSliceOffsetXMmDraft, committed: activeForm.sliceOffsetXMM, field: "sliceOffsetXMM" as const },
                            { label: "Y", draft: sliceOffsetYMmDraft, setDraft: setSliceOffsetYMmDraft, committed: activeForm.sliceOffsetYMM, field: "sliceOffsetYMM" as const },
                            { label: "Z", draft: sliceOffsetZMmDraft, setDraft: setSliceOffsetZMmDraft, committed: activeForm.sliceOffsetZMM, field: "sliceOffsetZMM" as const },
                          ] as const
                        ).map(({ label, draft, setDraft, committed, field }) => (
                          <Box
                            key={label}
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              alignItems: { xs: "stretch", sm: "center" },
                              flexWrap: "nowrap",
                              gap: 1.5,
                              width: "100%",
                              maxWidth: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                            }}
                          >
                            <Typography
                              variant="body2"
                              component="div"
                              sx={{
                                flexShrink: 0,
                                boxSizing: "border-box",
                                width: { xs: "100%", ...FOV_OFFSET_LABEL_COL_STACKED_PX },
                                minWidth: { xs: 0, ...FOV_OFFSET_LABEL_COL_STACKED_PX },
                                maxWidth: { xs: "100%", ...FOV_OFFSET_LABEL_COL_STACKED_PX },
                                pr: { sm: 0.5 },
                                lineHeight: 1.35,
                              }}
                            >
                              {label}:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: { xs: "flex-start", sm: "space-between" },
                                gap: { xs: 1.5, sm: 2 },
                                flex: "1 1 0",
                                flexWrap: "wrap",
                                minWidth: 0,
                                width: { xs: "100%", sm: "auto" },
                                maxWidth: "100%",
                                boxSizing: "border-box",
                              }}
                            >
                              <Slider
                                size="medium"
                                disabled={protocolSequences.length === 0}
                                value={committed}
                                min={FOV_OFFSET_MM_MIN}
                                max={FOV_OFFSET_MM_MAX}
                                step={0.5}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => `${v} mm`}
                                getAriaValueText={(v) => `${v} mm`}
                                onChange={(_, v) => {
                                  const num = typeof v === "number" ? v : v[0];
                                  setDraft(null);
                                  patchActiveSequenceGeometry({ [field]: num });
                                }}
                                sx={FOV_STACKED_SLIDER_SX}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  flexShrink: 0,
                                  flexWrap: "wrap",
                                  minWidth: 0,
                                }}
                              >
                                <TextField
                                  type="text"
                                  inputMode="decimal"
                                  size="small"
                                  disabled={protocolSequences.length === 0}
                                  value={draft !== null ? draft : String(committed)}
                                  onFocus={() => setDraft(String(committed))}
                                  onChange={(e) => setDraft(e.target.value)}
                                  onBlur={() => {
                                    patchActiveSequenceGeometry({
                                      [field]: commitSignedMm(draft ?? "", committed),
                                    });
                                    setDraft(null);
                                  }}
                                  sx={{ width: FOV_GEOMETRY_TRANSLATION_INPUT_WIDTH_PX, flexShrink: 0 }}
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">mm</InputAdornment>
                                    ),
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                          mt: 1,
                        }}
                      >
                        <Tooltip title="Place the slice group center back on the volume isocenter">
                          <span>
                            <CmrButton
                              variant="outlined"
                              size="small"
                              disabled={!nv?.volumes?.[0]}
                              onClick={() => {
                                patchActiveSequenceGeometry({
                                  sliceOffsetXMM: 0,
                                  sliceOffsetYMM: 0,
                                  sliceOffsetZMM: 0,
                                });
                                try {
                                  resetFovSliceTranslation(nv);
                                } catch {
                                  /* volume not ready */
                                }
                              }}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              Reset Translation
                            </CmrButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title="Slice offset from volume isocenter (mm) for the central slice of the stack. LR (left-right): +x toward left. AP (anterior-posterior): +y toward posterior. FH (foot-head): +z toward head. Patient-fixed frame, head-first."
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              aria-label="About slice offset from isocenter"
                              disabled={protocolSequences.length === 0}
                              tabIndex={protocolSequences.length === 0 ? -1 : 0}
                              sx={{ color: "text.secondary" }}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                      <Box
                        sx={{
                          marginTop: FOV_GEOMETRY_SECTION_MARGIN_TOP,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                          Rotation
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                            width: "100%",
                            maxWidth: "100%",
                            minWidth: 0,
                            boxSizing: "border-box",
                          }}
                        >
                          {fovAngleRows.map((row, index) => {
                            const isLr = row.axisKey === "lr";
                            const committedDeg = isLr
                              ? activeForm.angulationLRdeg
                              : activeForm.angulationAPdeg;
                            return (
                              <Box
                                key={`${row.axisKey}-${index}`}
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", sm: "row" },
                                  alignItems: { xs: "stretch", sm: "center" },
                                  flexWrap: "nowrap",
                                  gap: 1.5,
                                  width: "100%",
                                  maxWidth: "100%",
                                  minWidth: 0,
                                  boxSizing: "border-box",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  component="div"
                                  sx={{
                                    flexShrink: 0,
                                    boxSizing: "border-box",
                                    width: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                    minWidth: { xs: 0, ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                    maxWidth: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                    pr: { sm: 0.5 },
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {row.label}:
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: { xs: "flex-start", sm: "space-between" },
                                    gap: { xs: 1.5, sm: 2 },
                                    flex: "1 1 0",
                                    flexWrap: "wrap",
                                    minWidth: 0,
                                    width: { xs: "100%", sm: "auto" },
                                    maxWidth: "100%",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  <Slider
                                    size="medium"
                                    disabled={protocolSequences.length === 0}
                                    value={committedDeg}
                                    min={FOV_ANGULATION_DEG_MIN}
                                    max={FOV_ANGULATION_DEG_MAX}
                                    step={0.1}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) => `${v}°`}
                                    getAriaValueText={(v) => `${v} degrees`}
                                    onChange={(_, v) => {
                                      const num = typeof v === "number" ? v : v[0];
                                      if (isLr) {
                                        setFovAngulationLRdraft(null);
                                        patchActiveSequenceGeometry({ angulationLRdeg: num });
                                      } else {
                                        setFovAngulationAPdraft(null);
                                        patchActiveSequenceGeometry({ angulationAPdeg: num });
                                      }
                                    }}
                                    sx={FOV_STACKED_SLIDER_SX}
                                  />
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                      flexShrink: 0,
                                      flexWrap: "wrap",
                                      minWidth: 0,
                                    }}
                                  >
                                    <TextField
                                      type="text"
                                      inputMode="decimal"
                                      size="small"
                                      disabled={protocolSequences.length === 0}
                                      value={
                                        isLr
                                          ? fovAngulationLRdraft !== null
                                            ? fovAngulationLRdraft
                                            : String(committedDeg)
                                          : fovAngulationAPdraft !== null
                                            ? fovAngulationAPdraft
                                            : String(committedDeg)
                                      }
                                      onFocus={() =>
                                        isLr
                                          ? setFovAngulationLRdraft(String(activeForm.angulationLRdeg))
                                          : setFovAngulationAPdraft(String(activeForm.angulationAPdeg))
                                      }
                                      onChange={(e) =>
                                        isLr
                                          ? setFovAngulationLRdraft(e.target.value)
                                          : setFovAngulationAPdraft(e.target.value)
                                      }
                                      onBlur={() => {
                                        if (isLr) {
                                          patchActiveSequenceGeometry({
                                            angulationLRdeg: commitAngulationDeg(
                                              fovAngulationLRdraft ?? "",
                                              activeForm.angulationLRdeg,
                                            ),
                                          });
                                          setFovAngulationLRdraft(null);
                                        } else {
                                          patchActiveSequenceGeometry({
                                            angulationAPdeg: commitAngulationDeg(
                                              fovAngulationAPdraft ?? "",
                                              activeForm.angulationAPdeg,
                                            ),
                                          });
                                          setFovAngulationAPdraft(null);
                                        }
                                      }}
                                      sx={{ width: FOV_GEOMETRY_NUMERIC_INPUT_WIDTH_PX, flexShrink: 0 }}
                                      InputProps={{
                                        endAdornment: (
                                          <InputAdornment position="end">°</InputAdornment>
                                        ),
                                      }}
                                    />
                                    {/* TEMP: rotation Lock checkboxes (stacked) — restore when needed
                                    <Box sx={{ "& .MuiFormControlLabel-root": { margin: 0 } }}>
                                      <CmrCheckbox
                                        id={isLr ? "fov-lock-lr-angulation" : "fov-lock-ap-angulation"}
                                        checked={isLr ? fovInteractiveLockLR : fovInteractiveLockAP}
                                        checkedColor="#1578A1"
                                        disabled={protocolSequences.length === 0}
                                        onChange={(e) =>
                                          isLr
                                            ? setFovInteractiveLockLR(e.target.checked)
                                            : setFovInteractiveLockAP(e.target.checked)
                                        }
                                      >
                                        Lock
                                      </CmrCheckbox>
                                    </Box>
                                    */}
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              alignItems: { xs: "stretch", sm: "center" },
                              flexWrap: "nowrap",
                              gap: 1.5,
                              width: "100%",
                              maxWidth: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                            }}
                          >
                            <Box
                              sx={{
                                flexShrink: 0,
                                boxSizing: "border-box",
                                width: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                minWidth: { xs: 0, ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                maxWidth: { xs: "100%", ...FOV_ANGLE_LABEL_COL_WIDTH_PX },
                                pr: { sm: 0.5 },
                                lineHeight: 1.35,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Typography variant="body2" component="div">
                                Z:
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: { xs: "flex-start", sm: "space-between" },
                                gap: { xs: 1.5, sm: 2 },
                                flex: "1 1 0",
                                flexWrap: "wrap",
                                minWidth: 0,
                                width: { xs: "100%", sm: "auto" },
                                maxWidth: "100%",
                                boxSizing: "border-box",
                              }}
                            >
                              <Slider
                                size="medium"
                                disabled={protocolSequences.length === 0 || fovInteractiveLockZ}
                                value={activeForm.angulationZDeg}
                                min={FOV_Z_ANGULATION_DEG_MIN}
                                max={FOV_Z_ANGULATION_DEG_MAX}
                                step={0.1}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => `${v}°`}
                                getAriaValueText={(v) => `${v} degrees`}
                                onChange={(_, v) => {
                                  const num = typeof v === "number" ? v : v[0];
                                  setFovAngulationZDraft(null);
                                  patchActiveSequenceGeometry({ angulationZDeg: num });
                                }}
                                sx={FOV_STACKED_SLIDER_SX}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  flexShrink: 0,
                                  flexWrap: "wrap",
                                  minWidth: 0,
                                }}
                              >
                                <TextField
                                  type="text"
                                  inputMode="decimal"
                                  size="small"
                                  disabled={protocolSequences.length === 0 || fovInteractiveLockZ}
                                  value={
                                    fovAngulationZDraft !== null
                                      ? fovAngulationZDraft
                                      : String(activeForm.angulationZDeg)
                                  }
                                  onFocus={() =>
                                    setFovAngulationZDraft(String(activeForm.angulationZDeg))
                                  }
                                  onChange={(e) => setFovAngulationZDraft(e.target.value)}
                                  onBlur={() => {
                                    patchActiveSequenceGeometry({
                                      angulationZDeg: commitAngulationZDeg(
                                        fovAngulationZDraft ?? "",
                                        activeForm.angulationZDeg,
                                      ),
                                    });
                                    setFovAngulationZDraft(null);
                                  }}
                                  sx={{ width: FOV_GEOMETRY_NUMERIC_INPUT_WIDTH_PX, flexShrink: 0 }}
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">°</InputAdornment>
                                    ),
                                  }}
                                />
                                {/* TEMP: rotation Z Lock (stacked) — restore when needed
                                <Box sx={{ "& .MuiFormControlLabel-root": { margin: 0 } }}>
                                  <CmrCheckbox
                                    id="fov-lock-z-angulation"
                                    checked={fovInteractiveLockZ}
                                    checkedColor="#1578A1"
                                    disabled={protocolSequences.length === 0}
                                    onChange={(e) => setFovInteractiveLockZ(e.target.checked)}
                                  >
                                    Lock
                                  </CmrCheckbox>
                                </Box>
                                */}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                          mt: 1,
                        }}
                      >
                        <Tooltip title="Set LR, AP, and Z rotation angles back to zero">
                          <span>
                            <CmrButton
                              variant="outlined"
                              size="small"
                              disabled={!nv?.volumes?.[0]}
                              onClick={() => {
                                setFovAngulationLRdraft(null);
                                setFovAngulationAPdraft(null);
                                setFovAngulationZDraft(null);
                                patchActiveSequenceGeometry({
                                  angulationLRdeg: 0,
                                  angulationAPdeg: 0,
                                  angulationZDeg: 0,
                                });
                              }}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              Reset Rotation
                            </CmrButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                    )}
                    <Box
                      sx={{
                        marginTop: FOV_GEOMETRY_SECTION_MARGIN_TOP,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        flexWrap: "wrap",
                        alignItems: { xs: "stretch", sm: "flex-end" },
                        gap: { xs: 2, sm: 2 },
                        columnGap: { sm: 2 },
                        rowGap: 1.5,
                        width: "100%",
                      }}
                    >
                      <Box sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" }, minWidth: 0 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "flex-end" }}>
                          <TextField
                            label="Number of slices"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={
                              sagittalNumSlicesDraft !== null
                                ? sagittalNumSlicesDraft
                                : activeForm.sagittalNumSlices
                            }
                            onFocus={() => setSagittalNumSlicesDraft(String(activeForm.sagittalNumSlices))}
                            onChange={(e) => setSagittalNumSlicesDraft(e.target.value)}
                            onBlur={() => {
                              patchActiveSequenceGeometry({
                                sagittalNumSlices: commitSliceCount(
                                  sagittalNumSlicesDraft ?? "",
                                  activeForm.sagittalNumSlices,
                                ),
                              });
                              setSagittalNumSlicesDraft(null);
                            }}
                            inputProps={{ step: "any" }}
                            sx={{ width: FOV_PARALLEL_RANGES_FIELD_WIDTH_PX }}
                          />
                          <TextField
                            label="Slice thickness (mm)"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={
                              sagittalThicknessDraft !== null
                                ? sagittalThicknessDraft
                                : activeForm.sagittalSliceThicknessMm
                            }
                            onFocus={() => setSagittalThicknessDraft(String(activeForm.sagittalSliceThicknessMm))}
                            onChange={(e) => setSagittalThicknessDraft(e.target.value)}
                            onBlur={() => {
                              patchActiveSequenceGeometry({
                                sagittalSliceThicknessMm: commitFovResMm(
                                  sagittalThicknessDraft ?? "",
                                  activeForm.sagittalSliceThicknessMm,
                                ),
                              });
                              setSagittalThicknessDraft(null);
                            }}
                            inputProps={{ step: "any" }}
                            sx={{ width: FOV_PARALLEL_RANGES_THICKNESS_FIELD_WIDTH_PX }}
                          />
                          <TextField
                            label="Slice gap (%)"
                            type="number"
                            size="small"
                            disabled={protocolSequences.length === 0}
                            value={sagittalGapDraft !== null ? sagittalGapDraft : activeForm.sagittalSliceGapPct}
                            onFocus={() => setSagittalGapDraft(String(activeForm.sagittalSliceGapPct))}
                            onChange={(e) => setSagittalGapDraft(e.target.value)}
                            onBlur={() => {
                              patchActiveSequenceGeometry({
                                sagittalSliceGapPct: commitNonNegMm(
                                  sagittalGapDraft ?? "",
                                  activeForm.sagittalSliceGapPct,
                                ),
                              });
                              setSagittalGapDraft(null);
                            }}
                            inputProps={{ step: "any" }}
                            sx={{ width: FOV_PARALLEL_RANGES_FIELD_WIDTH_PX }}
                          />
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          flex: { xs: "1 1 100%", sm: "1 1 0" },
                          minWidth: { xs: 0, sm: 120 },
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
                          Opacity
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                            minWidth: 0,
                          }}
                        >
                          <Slider
                            size="medium"
                            value={fovMeshOpacity}
                            min={0}
                            max={1}
                            step={0.01}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                            getAriaValueText={(v) => `${Math.round(v * 100)}%`}
                            onChange={(_, v) => setFovMeshOpacity(typeof v === "number" ? v : v[0])}
                            sx={{
                              flex: "1 1 0",
                              minWidth: 0,
                              color: "#1578A1",
                              mx: 0,
                              "& .MuiSlider-thumb": { color: "#1578A1" },
                              "& .MuiSlider-track": { color: "#1578A1" },
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ flexShrink: 0, minWidth: "2.5rem", color: "text.secondary", textAlign: "right" }}
                          >
                            {Math.round(fovMeshOpacity * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                      </>
                    )}
                  </Box>
                  {selectedProtocolSeqId ? (
                <Divider orientation="horizontal" flexItem sx={{
                  mx: 0, mb: 1, mt: 4, borderColor: "rgba(0, 0, 0, 0.35)",
                  borderRightWidth: 1.5,
                }} />
                  ) : null}
                </Box>

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
                  showFovBoundingBox={Boolean(selectedProtocolSeqId) && showFieldOfViewOverlay}
                  showFovSlicesToggle={Boolean(selectedProtocolSeqId)}
                  showFovSlices={showFieldOfViewOverlay}
                  onShowFovSlicesChange={setShowFieldOfViewOverlay}
                  fovBoxOptions={setupFovBoxOptions}
                  onDragModeChange={(mode: string) => {
                    if (mode === "translate-slice") setFovInteractiveMode("translate");
                    else if (mode === "angle-slice") setFovInteractiveMode("angle");
                    else setFovInteractiveMode(null);
                  }}
                // initialSliceType="sagittal"
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

      <Dialog
        open={backendPayloadDialogOpen}
        onClose={() => setBackendPayloadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Backend payload</DialogTitle>
        <DialogContent dividers>
          {backendPayloadError ? (
            <Alert severity="error">{backendPayloadError}</Alert>
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1,
                maxHeight: "65vh",
                overflow: "auto",
                fontFamily: "ui-monospace, Consolas, monospace",
                fontSize: 12,
                lineHeight: 1.45,
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 1,
              }}
            >
              {backendPayloadText}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
          {!backendPayloadError && backendPayloadText ? (
            <CmrButton
              variant="outlined"
              onClick={() => {
                void navigator.clipboard.writeText(backendPayloadText);
              }}
            >
              Copy JSON
            </CmrButton>
          ) : null}
          <CmrButton variant="contained" onClick={() => setBackendPayloadDialogOpen(false)}>
            Close
          </CmrButton>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

export default Setup;
