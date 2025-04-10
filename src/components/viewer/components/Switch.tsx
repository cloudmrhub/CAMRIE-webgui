import React from "react";
import { Box, Typography, Switch } from "@mui/material";

interface NVSwitchProps {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NVSwitch: React.FC<NVSwitchProps> = ({ title, checked, onChange }) => {
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
      }}
      m={1}
    >
      <Typography sx={{ mr: "auto" }}>{title}</Typography>
      <Switch checked={checked} onChange={handleToggle} inputProps={{ "aria-label": title }} />
    </Box>
  );
};

export default NVSwitch;
