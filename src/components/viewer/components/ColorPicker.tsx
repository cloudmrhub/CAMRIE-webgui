import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Input, Box } from '@mui/material';

interface ColorPickerProps {
  title: string;
  colorRGB01: [number, number, number];
  onSetColor: (rgb01: [number, number, number]) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ title, colorRGB01, onSetColor }) => {
  const [hexColor, setHexColor] = useState<string>('#ff0000');

  const rgb01Torgb255 = (rgb: [number, number, number]): [number, number, number] => [
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255),
  ];

  const componentToHex = (c: number): string =>
    c.toString(16).padStart(2, '0');

  const rgb2Hex = (rgb: [number, number, number]): string =>
    `#${componentToHex(rgb[0])}${componentToHex(rgb[1])}${componentToHex(rgb[2])}`;

  const hex2rgb = (hex: string): [number, number, number] => [
    parseInt(hex.substring(1, 3), 16),
    parseInt(hex.substring(3, 5), 16),
    parseInt(hex.substring(5, 7), 16),
  ];

  useEffect(() => {
    const rgb255 = rgb01Torgb255(colorRGB01);
    const hex = rgb2Hex(rgb255);
    setHexColor(hex);
  }, [colorRGB01]);

  const updateColor = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const hex = event.target.value;
      setHexColor(hex);

      const rgb = hex2rgb(hex);
      const rgb01: [number, number, number] = [
        rgb[0] / 255,
        rgb[1] / 255,
        rgb[2] / 255,
      ];

      onSetColor(rgb01);
    },
    [onSetColor]
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', m: 1 }}>
      <Typography sx={{ marginRight: 'auto' }}>{title}</Typography>
      <Input
        type="color"
        disableUnderline
        sx={{ width: '50px', height: '20px' }}
        value={hexColor}
        onInput={updateColor}
      />
    </Box>
  );
};
