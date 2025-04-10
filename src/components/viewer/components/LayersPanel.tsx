import React, { useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GestureIcon from '@mui/icons-material/Gesture';
import CodeIcon from '@mui/icons-material/Code';
import LayersIcon from '@mui/icons-material/Layers';
import AddIcon from '@mui/icons-material/Add';

interface LayersPanelProps {
  open: boolean;
  width: number;
  onToggleMenu: () => void;
  onAddLayer: (file: File) => void;
  children?: React.ReactNode;
}

export function LayersPanel({
  open,
  width,
  onToggleMenu,
  onAddLayer,
  children
}: LayersPanelProps) {
  const handleAddLayer = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';

    input.onchange = async () => {
      if (input.files?.[0]) {
        onAddLayer(input.files[0]);
      }
    };

    input.click();
  }, [onAddLayer]);

  return (
    <Drawer open={open} variant="temporary" anchor="left" sx={{ width }}>
      <Box sx={{ width, display: 'flex', flexDirection: 'row', height: '100%' }}>
        {/* Sidebar Icons */}
        <Box
          sx={{
            width: 48,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F8F8F8',
            height: '100%',
            alignItems: 'center',
          }}
        >
          <IconButton sx={{ mt: 4 }} aria-label="Layer tools">
            <LayersIcon color="primary" />
          </IconButton>
          <IconButton sx={{ mt: 1 }} aria-label="Gesture mode">
            <GestureIcon />
          </IconButton>
          <IconButton sx={{ mt: 1 }} aria-label="Code mode">
            <CodeIcon />
          </IconButton>
        </Box>

        {/* Main Panel */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            px: 2,
            height: '100%',
          }}
        >
          <Box display="flex">
            <IconButton onClick={onToggleMenu} sx={{ ml: 'auto' }} aria-label="Close panel">
              <ArrowBackIcon />
            </IconButton>
          </Box>

          <Box sx={{ mt: 1, mb: 2 }}>
            <Button onClick={handleAddLayer} endIcon={<AddIcon />} size="small">
              Add Layer
            </Button>
          </Box>

          {children}
        </Box>
      </Box>
    </Drawer>
  );
}
