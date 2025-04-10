import React from 'react';
import { Stack, IconButton, Slider, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FiberManualRecordOutlinedIcon from '@mui/icons-material/FiberManualRecordOutlined';

interface EraserPlatteProps {
  expandEraseOptions: boolean;
  updateDrawPen: (e: { target: { value: number } }) => void;
  setDrawingEnabled: (enabled: boolean) => void;
  brushSize: number;
  updateBrushSize: (size: number) => void;
}

const EraserPlatte: React.FC<EraserPlatteProps> = ({
  expandEraseOptions,
  updateDrawPen,
  setDrawingEnabled,
  brushSize,
  updateBrushSize,
}) => {
  const eraseIcons = [
    <FiberManualRecordIcon key="filled" sx={{ color: 'white' }} />,
    <FiberManualRecordOutlinedIcon key="outline" sx={{ color: 'white' }} />,
  ];

  return (
    <Stack
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10,
        border: expandEraseOptions ? '1px solid #bbb' : 0,
        maxWidth: expandEraseOptions ? 300 : 0,
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
          {`Eraser Size: ${brushSize}`}
        </Typography>
        <Slider
          sx={{ width: '80%' }}
          value={brushSize}
          step={2}
          min={1}
          max={15}
          marks
          onChange={(_, value) => updateBrushSize(value as number)}
        />
      </Stack>

      <Stack direction="row" justifyContent="center">
        {eraseIcons.map((icon, index) => (
          <IconButton
            key={index}
            onClick={() => {
              updateDrawPen({ target: { value: index === 0 ? 8 : 0 } });
              setDrawingEnabled(true);
            }}
          >
            {icon}
          </IconButton>
        ))}
      </Stack>
    </Stack>
  );
};

export default EraserPlatte;
