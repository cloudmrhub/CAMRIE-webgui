import React, { useEffect, useMemo, useState } from 'react';
import {
  Stack,
  IconButton,
  Typography,
  Box
} from '@mui/material';

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { InvertibleDualSlider } from '../../Cmr-components/double-slider/InvertibleDualSlider';
import CmrCheckbox from '../../Cmr-components/checkbox/Checkbox';

interface MaskPlatteProps {
  expanded: boolean;
  nv: any;
  setMaskColor: (color: string | undefined) => void;
  resampleImage: () => void;
  unfocus: () => void;
}

const MaskPlatte: React.FC<MaskPlatteProps> = ({
  expanded,
  nv,
  setMaskColor,
  resampleImage,
  unfocus
}) => {
  const [colorIndex, setColorIndex] = useState(0);
  const [maskColor, setLocalMaskColor] = useState('red');
  const [checked, setChecked] = useState(false);
  const [original, setOriginal] = useState<Uint8Array | undefined>(undefined);
  const [min, setMin] = useState(nv?.volumes?.[0]?.vox_min ?? 0);
  const [max, setMax] = useState(nv?.volumes?.[0]?.vox_max ?? 1);
  
  const colors = useMemo(() => ['red', 'green', 'blue', 'yellow', 'cyan', '#e81ce8'], []);
  const filledOptions = useMemo(() =>
    colors.map((color, index) => (
      <IconButton
        key={index}
        onClick={() => {
          setColorIndex(index);
          setLocalMaskColor(colors[index]);
          setMaskColor(colors[index]);
          nv.fillRange(min, max, index + 1, checked, original, setOriginal);
          resampleImage();
        }}
      >
        <FiberManualRecordIcon sx={{ color }} />
      </IconButton>
    )), [colors, checked, min, max, nv, original, resampleImage, setMaskColor]
  );


  const cancelMask = () => {
    if (original) {
      nv.drawBitmap = new Uint8Array(original);
      nv.refreshDrawing(true);
      resampleImage();
      setOriginal(undefined);
    }
  };

  useEffect(() => {
    if (expanded) {
      setMaskColor(maskColor);
      nv.fillRange(min, max, colorIndex + 1, checked, original, setOriginal);
      resampleImage();
    } else {
      setMaskColor(undefined);
      cancelMask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  useEffect(() => {
    if (expanded && colorIndex !== -1) {
      nv.fillRange(min, max, colorIndex + 1, checked, original, setOriginal);
      resampleImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, checked]);

  return (
    <Stack
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10,
        border: expanded ? '1px solid #bbb' : 0,
        maxWidth: expanded ? 450 : 0,
        overflow: 'hidden',
        borderRadius: '16px',
        borderTopLeftRadius: '6pt',
        borderTopRightRadius: '6pt',
        background: '#333',
      }}
      direction="column"
    >
      <Stack alignItems="center">
        <Typography color="white" gutterBottom width="100%" ml="10pt" fontSize="11pt">
          Mask range:
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="center">
        {filledOptions}
        <CmrCheckbox
          style={{ color: 'white' }}
          onChange={(e) => {
            e.stopPropagation();
            setChecked(e.target.checked);
            resampleImage();
          }}
          checked={checked}
        >
          Inverted
        </CmrCheckbox>
      </Stack>

      <Stack direction="row" sx={{ mb: 1 }}>
        <Box width={400} px={2}>
          <InvertibleDualSlider
            name=""
            min={nv?.volumes[0]?.vox_min ?? 0}
            max={nv?.volumes[0]?.vox_max ?? 1}
            reverse={checked}
            setMin={setMin}
            setMax={setMax}
            onFinalize={() => resampleImage()}
          />
        </Box>
      </Stack>

      <Stack direction="row" justifyContent="center">
        <IconButton
          onClick={() => {
            setOriginal(undefined);
            nv.drawAddUndoBitmapWithHiddenVoxels();
            unfocus();
          }}
        >
          <CheckIcon sx={{ color: 'green' }} />
        </IconButton>

        <IconButton
          onClick={() => {
            cancelMask();
            unfocus();
          }}
        >
          <CloseIcon sx={{ color: 'red' }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default MaskPlatte;
