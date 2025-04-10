import { useMemo } from 'react';
import { Stack, IconButton, Slider, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface DrawPlatteProps {
  expandDrawOptions: boolean;
  updateDrawPen: (e: { target: { value: number } }) => void;
  setDrawingEnabled: (enabled: boolean) => void;
  brushSize: number;
  updateBrushSize: (size: number) => void;
}

const DrawPlatte: React.FC<DrawPlatteProps> = ({
  expandDrawOptions,
  updateDrawPen,
  setDrawingEnabled,
  brushSize,
  updateBrushSize,
}) => {
  const colorOptions = useMemo(
    () => ['red', 'green', 'blue', 'yellow', 'cyan', '#e81ce8'],
    []
  );

  return (
    <Stack
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10,
        border: expandDrawOptions ? '1px solid #bbb' : 0,
        maxWidth: expandDrawOptions ? 300 : 0,
        overflow: 'hidden',
        borderRadius: '16px',
        borderTopLeftRadius: '6pt',
        borderTopRightRadius: '6pt',
        background: '#333',
        transition: 'all 0.3s ease',
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
          {`Brush Size: ${brushSize}`}
        </Typography>
        <Slider
          value={brushSize}
          sx={{ width: '80%' }}
          step={2}
          min={1}
          max={15}
          marks
          onChange={(_, value) => updateBrushSize(value as number)}
        />
      </Stack>

      <Stack direction="row" justifyContent="center">
        {colorOptions.map((color, index) => (
          <IconButton
            key={index}
            aria-label={`Set pen color ${color}`}
            title={`Set pen color ${color}`}
            onClick={() => {
              updateDrawPen({ target: { value: index + 1 } });
              setDrawingEnabled(true);
            }}
          >
            <FiberManualRecordIcon sx={{ color }} />
          </IconButton>
        ))}
      </Stack>
    </Stack>
  );
};

export default DrawPlatte;
