import React, { useEffect, useState } from "react";
import { Box, Typography, Input } from "@mui/material";

interface NumberPickerProps {
  title: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

export const NumberPicker: React.FC<NumberPickerProps> = ({
  title,
  value: initialValue,
  min,
  max,
  step = 1,
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleNumberInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    let v = parseFloat(event.target.value);
    if (isNaN(v)) return;

    v = Math.max(min, Math.min(max, v));
    setValue(v);
    onChange(v);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }} m={1}>
      <Typography sx={{ mr: "auto" }}>{title}</Typography>
      <Input
        type="number"
        disableUnderline
        sx={{ width: "60px", height: "20px", textAlign: "right" }}
        inputProps={{ step, min, max }}
        value={value}
        onChange={handleNumberInput}
        aria-label={title}
        title={title}
      />
    </Box>
  );
};
