import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';


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
  // const [detailsOpen, setDetailsOpen] = useState(true);
  const [color, setColor] = useState(image.colormap);
  const [opacity, setOpacity] = useState(1.0);

  const colormapNames = nv.colormaps?.() ?? [];

  const handleColorChange = (event: SelectChangeEvent) => {

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

    <Box
      display="flex"
      flexDirection="row"
      justifyContent="flex-start"
      width="100%"
      // marginLeft={1}
      marginTop={3}
    >
      <FormControl>
        <InputLabel>Color</InputLabel>
        <Select
          value={color}
          label="Color"
          size="small"
          onChange={handleColorChange}
          sx={{ width: { xs: 250, sm: 250, md: 200 } }}
        >
          {colormapNames.map((name: string) => (
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

    </Box>


  );
};

export default Layer;
