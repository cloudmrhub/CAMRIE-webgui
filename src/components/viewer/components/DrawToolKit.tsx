import React, { CSSProperties, useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Slider,
  Stack,
  SvgIcon,
  SvgIconProps,
  Tooltip,
  Typography,
} from '@mui/material';

import BrushIcon from '@mui/icons-material/Brush';
import AutoFixNormalOutlinedIcon from '@mui/icons-material/AutoFixNormalOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import OpacityIcon from '@mui/icons-material/Opacity';

import { ROI } from '../../../features/results/resultsSlice';


import DrawPlatte from './DrawPlatte';
import EraserPlatte from './EraserPlatte';
import MaskPlatte from './MaskPlatte';

export interface DrawToolkitProps {
  nv: any;
  volumes: { url: string; name: string }[];
  selectedVolume: number;
  updateDrawPen: (e: { target: { value: number } }) => void;
  drawPen: number;
  setDrawingEnabled: (enabled: boolean) => void;
  drawingEnabled: boolean;
  rois: ROI[];
  selectedROI: number;
  setSelectedROI: (selected: number) => void;
  saveROI: () => void;
  changesMade: boolean;
  drawUndo: () => void;
  style: CSSProperties;
  brushSize: number;
  updateBrushSize: (size: number) => void;
  resampleImage: () => void;
  roiVisible: boolean;
  toggleROIVisible: () => void;
  drawingOpacity: number;
  setDrawingOpacity: (opacity: number) => void;
  labelsVisible: boolean;
  toggleLabelsVisible: () => void;
  setDrawingChanged: (changed: boolean) => void;
}

export const DrawToolkit: React.FC<DrawToolkitProps> = (props) => {
  const [expandedOption, setExpandedOption] = useState<'n' | 'd' | 'e' | 'm'>('n');
  const [expandOpacityOptions, setExpandOpacityOptions] = useState(false);
  const [maskColor, setMaskColor] = useState<string | undefined>();

  const penColor = ['red', 'green', 'blue', 'yellow', 'cyan', '#e81ce8'][(props.drawPen & 7) - 1];
  const filled = props.drawPen > 7;

  const toggleOption = (opt: 'd' | 'e' | 'm') => {
    const isOpening = expandedOption !== opt;
    setExpandedOption(isOpening ? opt : 'n');

    if (opt === 'e' && isOpening) {
      props.updateDrawPen({ target: { value: 8 } });
    }

    const drawEnabled = isOpening && (opt === 'd' || opt === 'e');
    props.setDrawingEnabled(drawEnabled);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: '4px',
        height: '20pt',
        backgroundColor: '#333',
      }}
      style={props.style}
    >
      <FormControl>
        <FormLabel
          component="legend"
          sx={{
            ml: 2,
            color: 'white',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          ROI Tools:
        </FormLabel>
      </FormControl>

      {/* Draw Tool */}
      <FormControl>
        <Stack direction="row">
          <Tooltip title="Draw Tool">
            <IconButton onClick={() => toggleOption('d')}>
              <BrushIcon style={{ color: expandedOption === 'd' && penColor ? penColor : 'white' }} />
            </IconButton>
          </Tooltip>
          <DrawPlatte
            expandDrawOptions={expandedOption === 'd'}
            updateDrawPen={props.updateDrawPen}
            setDrawingEnabled={props.setDrawingEnabled}
            brushSize={props.brushSize}
            updateBrushSize={props.updateBrushSize}
          />
        </Stack>
      </FormControl>

      {/* Eraser Tool */}
      <FormControl>
        <Stack direction="row">
          <Tooltip title="Eraser">
            <IconButton onClick={() => toggleOption('e')}>
              {filled || expandedOption !== 'e' ? (
                <EraserIcon style={{ color: '#ddd' }} />
              ) : (
                <AutoFixNormalOutlinedIcon style={{ color: 'white' }} />
              )}
            </IconButton>
          </Tooltip>
          <EraserPlatte
            expandEraseOptions={expandedOption === 'e'}
            updateDrawPen={props.updateDrawPen}
            setDrawingEnabled={props.setDrawingEnabled}
            brushSize={props.brushSize}
            updateBrushSize={props.updateBrushSize}
          />
        </Stack>
      </FormControl>

      {/* Undo */}
      <FormControl>
        <Tooltip title="Undo">
          <IconButton onClick={props.drawUndo}>
            <ReplyIcon style={{ color: 'white' }} />
          </IconButton>
        </Tooltip>
      </FormControl>

      {/* Capture */}
      <FormControl>
        <Tooltip title="Capture Drawing">
          <IconButton
            onClick={() => {
              props.nv.saveScene(`${props.volumes[props.selectedVolume].name}_drawing.png`);
            }}
          >
            <CameraAltIcon style={{ color: 'white' }} />
          </IconButton>
        </Tooltip>
      </FormControl>

      {/* Clear */}
      <FormControl>
        <Tooltip title="Clear Drawing">
          <IconButton
            onClick={() => {
              props.nv.clearDrawing();
              props.resampleImage();
            }}
          >
            <DeleteIcon style={{ color: 'white' }} />
          </IconButton>
        </Tooltip>
      </FormControl>

      {/* Toggle ROI Visibility */}
      <Tooltip title="Toggle ROI Visibility">
        <FormControl>
          <IconButton onClick={props.toggleROIVisible}>
            {props.roiVisible ? (
              <VisibilityIcon style={{ color: 'white' }} />
            ) : (
              <VisibilityOffIcon style={{ color: 'white' }} />
            )}
          </IconButton>
        </FormControl>
      </Tooltip>

      {/* Opacity Tool */}
      <FormControl sx={{ flexDirection: 'row', alignItems: 'center', color: 'white' }}>
        <Tooltip title="Adjust Opacity">
          <IconButton onClick={() => setExpandOpacityOptions(!expandOpacityOptions)}>
            <OpacityIcon style={{ color: 'white' }} />
          </IconButton>
        </Tooltip>
        <Typography variant="body2">{props.drawingOpacity.toFixed(2)}</Typography>
        <OpacityPlatte
          drawingOpacity={props.drawingOpacity}
          setDrawingOpacity={props.setDrawingOpacity}
          expanded={expandOpacityOptions}
        />
      </FormControl>

      {/* Mask Fill Tool */}
      <FormControl>
        <Stack direction="row">
          <Tooltip title="Fill Mask">
            <IconButton onClick={() => toggleOption('m')}>
              <FormatColorFillIcon style={{ color: expandedOption === 'm' && maskColor ? maskColor : 'white' }} />
            </IconButton>
          </Tooltip>
        </Stack>
        <MaskPlatte
          resampleImage={() => {
            props.resampleImage();
            props.setDrawingChanged(true);
          }}
          expanded={expandedOption === 'm'}
          nv={props.nv}
          setMaskColor={setMaskColor}
          unfocus={() => setExpandedOption('n')}
        />
      </FormControl>
    </Box>
  );
};

function EraserIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 25 25">
      <rect
        x="6"
        y="3"
        width="12"
        height="22"
        rx="2"
        ry="2"
        transform="rotate(230 12 12)"
        fill="currentColor"
      />
      <rect
        x="7"
        y="4"
        width="10"
        height="8"
        rx="2"
        ry="2"
        transform="rotate(230 12 12)"
        fill="#FFFFFF"
      />
    </SvgIcon>
  );
}

const OpacityPlatte = ({
  drawingOpacity,
  setDrawingOpacity,
  expanded,
}: {
  drawingOpacity: number;
  setDrawingOpacity: (opacity: number) => void;
  expanded: boolean;
}) => {
  return (
    <Stack
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10,
        border: expanded ? '1px solid #bbb' : 0,
        maxWidth: expanded ? 300 : 0,
        overflow: 'hidden',
        borderRadius: '16px',
        borderTopLeftRadius: '6pt',
        borderTopRightRadius: '6pt',
        background: '#333',
        width: 150,
      }}
      direction="column"
    >
      <Stack sx={{ mb: 1 }} alignItems="center">
        <Typography
          color="white"
          noWrap
          gutterBottom
          width="100%"
          marginLeft="10pt"
          fontSize="11pt"
        >
          {`Opacity: ${drawingOpacity.toFixed(2)}`}
        </Typography>
        <Slider
          sx={{ width: '80%' }}
          value={drawingOpacity}
          step={0.01}
          min={0}
          max={1}
          onChange={(_, value) => setDrawingOpacity(value as number)}
        />
      </Stack>
    </Stack>
  );
};
