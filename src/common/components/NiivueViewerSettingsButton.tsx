import React, { ChangeEvent, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { CmrLabel } from "cloudmr-ux";

function rgb01ToHex(rgba: number[]): string {
  const r = Math.round((rgba[0] ?? 1) * 255);
  const g = Math.round((rgba[1] ?? 1) * 255);
  const b = Math.round((rgba[2] ?? 1) * 255);
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function hexToRgb01(hex: string): number[] {
  return [
    parseInt(hex.substring(1, 3), 16) / 255,
    parseInt(hex.substring(3, 5), 16) / 255,
    parseInt(hex.substring(5, 7), 16) / 255,
  ];
}

export type NiivueViewerSettingsButtonProps = {
  crosshairColor?: number[];
  crosshairOpacity?: number;
  crosshairSize?: number;
  backgroundColor?: number[];
  labelColor?: number[];
  maxDrawUndoBitmaps?: number;
  nv?: { opts?: { maxDrawUndoBitmaps?: number; crosshairWidth?: number } };
  onCrosshairColorChange?: (rgb01: number[], opacity: number) => void;
  onCrosshairSizeChange?: (size: number) => void;
  onBackgroundColorChange?: (rgb01: number[]) => void;
  onLabelColorChange?: (rgb01: number[]) => void;
  onMaxDrawUndoBitmapsChange?: (value: number) => void;
  accentColor?: string;
};

/** Same settings gear and dialog as the Results viewer toolbar. */
export default function NiivueViewerSettingsButton(props: NiivueViewerSettingsButtonProps) {
  const accentColor = props.accentColor ?? "#1578A1";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftColorHex, setDraftColorHex] = useState("#ffff00");
  const [draftOpacity, setDraftOpacity] = useState(1);
  const [draftSize, setDraftSize] = useState(1);
  const [draftBackColorHex, setDraftBackColorHex] = useState("#000000");
  const [draftLabelColorHex, setDraftLabelColorHex] = useState("#00ef5e");

  function openSettingsDialog() {
    const color = props.crosshairColor ?? [1, 1, 0, 1];
    setDraftColorHex(rgb01ToHex(color));
    setDraftOpacity(color[3] ?? props.crosshairOpacity ?? 1);
    const liveWidth = props.nv?.opts?.crosshairWidth;
    setDraftSize(
      props.crosshairSize && props.crosshairSize > 0
        ? props.crosshairSize
        : liveWidth && liveWidth > 0
          ? liveWidth
          : 1,
    );
    setDraftBackColorHex(rgb01ToHex(props.backgroundColor ?? [0, 0, 0, 1]));
    setDraftLabelColorHex(rgb01ToHex(props.labelColor ?? [0, 0.94, 0.37, 1]));
    setSettingsOpen(true);
  }

  function handleSettingsSave() {
    const rgb = hexToRgb01(draftColorHex);
    props.onCrosshairColorChange?.(rgb, draftOpacity);
    props.onCrosshairSizeChange?.(draftSize);
    props.onBackgroundColorChange?.(hexToRgb01(draftBackColorHex));
    props.onLabelColorChange?.(hexToRgb01(draftLabelColorHex));
    setSettingsOpen(false);
  }

  const colorInputStyle: React.CSSProperties = {
    width: 40,
    height: 28,
    padding: 0,
    border: "1px solid #ccc",
    borderRadius: 4,
    cursor: "pointer",
    background: "transparent",
  };

  return (
    <>
      <Tooltip title="Settings">
        <IconButton size="small" onClick={openSettingsDialog} sx={{ mx: 0.5 }}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent dividers>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ "&:last-child": { paddingBottom: 2 } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Background Settings
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CmrLabel style={{ fontSize: 14 }}>Color:</CmrLabel>
                <input
                  type="color"
                  value={draftBackColorHex}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftBackColorHex(e.target.value)}
                  style={colorInputStyle}
                />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ "&:last-child": { paddingBottom: 2 } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Label Settings
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CmrLabel style={{ fontSize: 14 }}>Color:</CmrLabel>
                <input
                  type="color"
                  value={draftLabelColorHex}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftLabelColorHex(e.target.value)}
                  style={colorInputStyle}
                />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ "&:last-child": { paddingBottom: 2 } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Crosshair Settings
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <CmrLabel style={{ fontSize: 14 }}>Color:</CmrLabel>
                <input
                  type="color"
                  value={draftColorHex}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftColorHex(e.target.value)}
                  style={colorInputStyle}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <CmrLabel style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                  Opacity: {draftOpacity.toFixed(1)}
                </CmrLabel>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={draftOpacity}
                  onChange={(e) => setDraftOpacity(Number(e.target.value))}
                  style={{ width: "100%", accentColor }}
                />
              </Box>
              <Box>
                <CmrLabel style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                  Size: {draftSize}
                </CmrLabel>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={draftSize}
                  onChange={(e) => setDraftSize(Number(e.target.value))}
                  style={{ width: "100%", accentColor }}
                />
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSettingsSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
