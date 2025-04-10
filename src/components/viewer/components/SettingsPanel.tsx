import React from 'react';
import { Drawer, Box, IconButton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface SettingsPanelProps {
  open: boolean;
  width: number;
  toggleMenu: () => void;
  children?: React.ReactNode;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  width,
  toggleMenu,
  children,
}) => {
  return (
    <Drawer open={open} variant="temporary" anchor="right" sx={{ width }}>
      <Box
        sx={{
          width,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
        role="presentation"
      >
        <Box sx={{ display: 'flex', mb: 1 }}>
          <IconButton
            onClick={toggleMenu}
            sx={{ mr: 'auto' }}
            aria-label="Close settings panel"
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Drawer>
  );
};
