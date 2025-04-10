import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface LayerProps {
  image: any;
  nii: { name: string };
  nv: any;
  onColorMapChange: (id: number, color: string) => void;
  onRemoveLayer: (image: any) => void;
  onOpacityChange: (opacity: number) => void;
  getColorMapValues: (name: string) => { R: number[]; G: number[]; B: number[] };
}

function makeColorGradient(cmap: { R: number[]; G: number[]; B: number[] }) {
  const n = cmap.R.length;
  const stops = cmap.R.map(
    (_, i) =>
      `rgba(${cmap.R[i]},${cmap.G[i]},${cmap.B[i]},1) ${(i / (n - 1)) * 100}%`
  ).join(',');
  return `linear-gradient(90deg,${stops})`;
}

const Layer: React.FC<LayerProps> = ({
  image,
  nii,
  nv,
  onColorMapChange,
  onRemoveLayer,
  onOpacityChange,
  getColorMapValues
}) => {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [color, setColor] = useState(image.colormap);
  const [opacity, setOpacity] = useState(1.0);

  const colormapNames = nv.colormaps?.() ?? [];

  const handleColorChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedColor = event.target.value as string;
    setColor(selectedColor);
    onColorMapChange(image.id, selectedColor);
  };

  const handleOpacityChanged = (value: number | number[]) => {
    const newOpacity = Array.isArray(value) ? value[0] : value;
    setOpacity(newOpacity);
    image.opacity = newOpacity;
    onOpacityChange(newOpacity);
  };

  return (
    <Box display="flex" flexDirection="column">
      <Paper
        elevation={0}
        sx={{
          my: 0.5,
          border: '1px solid gray'
        }}
      >
        <Box
          sx={{
            m: 1,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Typography sx={{ wordBreak: 'break-word', flexBasis: '75%' }}>
            {nii.name}
          </Typography>
          <IconButton sx={{ ml: 'auto' }} onClick={() => setDetailsOpen(!detailsOpen)}>
            {detailsOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>

        {detailsOpen && (
          <Box display="flex" flexDirection="column" width="100%">
            <Typography ml={2}>{`Opacity: ${opacity.toFixed(2)}`}</Typography>
            <Slider
              sx={{ width: '80%', alignSelf: 'center', my: 2 }}
              value={opacity}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, value) => handleOpacityChanged(value)}
            />

            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              width="100%"
              m={2}
            >
              <FormControl>
                <InputLabel>Color</InputLabel>
                <Select
                  value={color}
                  label="Color"
                  size="small"
                  onChange={handleColorChange}
                  sx={{ width: 200 }}
                >
                  {colormapNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <Box>{name}</Box>
                        <Box
                          sx={{
                            width: '30%',
                            ml: 1,
                            height: '1rem',
                            background: makeColorGradient(getColorMapValues(name))
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <IconButton onClick={() => onRemoveLayer(image)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Layer;
