import { Fragment } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Switch,
  Tooltip,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import Brightness6Icon from '@mui/icons-material/Brightness6';

import { ROI } from '../../features/results/resultsSlice';
import { useAppDispatch, useAppSelector } from '../../features/hooks';
import { getPipelineROI } from '../../features/results/resultActionCreation';

export default function Toolbar({
  accessToken = '',
  nv,
  sliceType,
  toggleSettings,
  toggleLayers,
  volumes,
  selectedVolume,
  setSelectedVolume,
  showColorBar,
  toggleColorBar,
  rois,
  selectedROI,
  setSelectedROI,
  verticalLayout,
  toggleVerticalLayout,
  toggleShowCrosshair,
  showCrosshair,
  dragMode,
  setDragMode,
  toggleRadiological,
  radiological,
  saveROI,
  complexMode,
  setComplexMode,
  complexOptions,
  labelsVisible,
  toggleLabelsVisible,
  saving,
  setSaving,
}: {
  accessToken?: string;
  nv: any;
  sliceType: string;
  toggleSettings: () => void;
  toggleLayers: () => void;
  volumes: { alias?: string }[];
  selectedVolume: number;
  setSelectedVolume: (value: number) => void;
  showColorBar: boolean;
  toggleColorBar: () => void;
  rois: ROI[];
  selectedROI: number;
  setSelectedROI: (value: number) => void;
  verticalLayout: boolean;
  toggleVerticalLayout: () => void;
  toggleShowCrosshair: () => void;
  showCrosshair: boolean;
  dragMode: string;
  setDragMode: (mode: string) => void;
  toggleRadiological: () => void;
  radiological: boolean;
  saveROI: () => void;
  complexMode: string;
  setComplexMode: (option: string) => void;
  complexOptions: string[];
  labelsVisible: boolean;
  toggleLabelsVisible: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const pipeline = useAppSelector((state) => state.result.activeJob?.pipeline_id);

  const dragModes = ['Pan', 'Measurement', 'Contrast', 'None'];

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    saveROI();
    if (pipeline) {
      await dispatch(getPipelineROI({ accessToken: accessToken ?? '', pipeline }));
    }
    setSaving(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {Array.isArray(volumes) && volumes[selectedVolume] !== undefined && (
        <Fragment>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              flexDirection: 'row',
              justifyItems: 'left',
              alignItems: 'center',
              backgroundColor: 'white',
              flexWrap: 'wrap',
            }}
          >
            <IconButton size={'small'} onClick={toggleLayers}>
              <MenuIcon />
            </IconButton>

            <FormControl size="small" sx={{ m: 2, minWidth: 120 }}>
              <InputLabel id="slice-type-label">Current Plot</InputLabel>
              <Select
                labelId="slice-type-label"
                id="slice-type"
                value={selectedVolume}
                label="Current Plot"
                onChange={(e: SelectChangeEvent<number>) => setSelectedVolume(Number(e.target.value))}
              >
                {volumes.map((value, index) => (
                  <MenuItem key={index} value={index}>
                    {value?.alias ?? `Volume ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ m: 2, minWidth: 120 }}>
              <InputLabel id="drag-mode-label">Right Button</InputLabel>
              <Select
                labelId="drag-mode-label"
                id="drag-mode"
                value={dragMode}
                label="Display mode"
                onChange={(e: SelectChangeEvent<string>) => setDragMode(e.target.value)}
              >
                {dragModes.map((value, index) => (
                  <MenuItem key={index} value={value.toLowerCase()}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ m: 2, minWidth: 120 }}>
              <InputLabel id="pixel-type-label">Pixel Type</InputLabel>
              <Select
                labelId="pixel-type-label"
                id="pixel-type"
                value={complexMode}
                label="Pixel Type"
                onChange={(e: SelectChangeEvent<string>) => setComplexMode(e.target.value)}
              >
                {complexOptions.map((value: string) => (
                  <MenuItem key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ m: 2, minWidth: 120 }}>
              <InputLabel id="roi-layer-label">ROI Layer</InputLabel>
              <Select
                labelId="roi-layer-label"
                id="roi-layer"
                value={selectedROI}
                label="ROI Layer"
                onChange={(e: SelectChangeEvent<number>) => setSelectedROI(Number(e.target.value))}
              >
                {rois.map((value, index) => (
                  <MenuItem key={index} value={index}>
                    {value.filename ?? `ROI ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant={'contained'}
              endIcon={saving && <CircularProgress sx={{ color: 'white' }} size={20} />}
              onClick={handleSave}
            >
              Save Drawing Layer
            </Button>

            <IconButton onClick={toggleSettings} style={{ marginLeft: 'auto' }}>
              <SettingsIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              width: '100%',
              flexDirection: 'row',
              justifyItems: 'left',
              alignItems: 'center',
              backgroundColor: 'white',
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }} m={1}>
              <Typography sx={{ marginRight: 'auto' }}>Neurological</Typography>
              <Switch checked={!radiological} onChange={toggleRadiological} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }} m={1}>
              <Typography sx={{ marginRight: 'auto' }}>Show Crosshair</Typography>
              <Switch checked={showCrosshair} onChange={toggleShowCrosshair} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }} m={1}>
              <Typography>Vertical Layout</Typography>
              <Switch checked={verticalLayout} onChange={toggleVerticalLayout} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }} m={1}>
              <Typography sx={{ marginRight: 'auto' }}>Show Color Bar</Typography>
              <Switch checked={showColorBar} onChange={toggleColorBar} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }} m={1}>
              <Typography sx={{ marginRight: 'auto' }}>Labels Visible</Typography>
              <Switch checked={labelsVisible} onChange={toggleLabelsVisible} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', m: 2 }}>
              <Tooltip title={'Reset Views'} placement={'right'}>
                <IconButton onClick={() => nv.resetScene()}>
                  <HomeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={'Recenter Views'} placement={'right'}>
                <IconButton onClick={() => nv.recenter()}>
                  <CenterFocusStrongIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={'Reset Zooms'} placement={'right'}>
                <IconButton onClick={() => nv.resetZoom()}>
                  <ZoomInMapIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={'Reset Contrast'} placement={'right'}>
                <IconButton onClick={() => nv.resetContrast()}>
                  <Brightness6Icon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Fragment>
      )}
    </Box>
  );
}
