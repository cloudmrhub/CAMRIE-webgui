import React, { ChangeEvent, Fragment, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Menu,
  Stack,
  SvgIconProps,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import { ROI } from "cloudmr-ux/core";
import { useAppDispatch, useAppSelector } from "../../features/hooks";
import { getPipelineROI } from "cloudmr-ux/core";
import HomeIcon from "@mui/icons-material/Home";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Brightness6Icon from "@mui/icons-material/Brightness6";

interface ToolbarProps {
  nv: any;
  nvUpdateSliceType: any;
  sliceType: string;

  toggleLayers: React.MouseEventHandler<HTMLButtonElement> | undefined;
  toggleSettings: React.MouseEventHandler<HTMLButtonElement> | undefined;
  volumes: { url: string; name: string; alias: string }[];
  selectedVolume: number;
  setSelectedVolume: (index: number) => void;
  showColorBar: boolean;
  toggleColorBar: () => void;
  rois: ROI[];
  selectedROI: number;
  setSelectedROI: (selected: number) => void;
  refreshROI: () => void;
  showCrosshair: boolean;
  toggleShowCrosshair: () => void;
  dragMode: boolean;
  setDragMode: (dragMode: string | boolean) => void;
  radiological: boolean;
  toggleRadiological: () => void;
  saveROI: (callback: () => void, preSaving: () => void) => void;
  complexMode: string;
  setComplexMode: (complexMode: string) => void;
  complexOptions: string[];

  labelsVisible: boolean;
  toggleLabelsVisible: () => void;

  /** Setup page: FoV slice overlay visibility (same as former “Show Slices” checkbox). */
  showFovSlicesToggle?: boolean;
  showFovSlices?: boolean;
  onShowFovSlicesChange?: (visible: boolean) => void;

  saving: boolean;
  setSaving: (saving: boolean) => void;
}

export default function Toolbar(props: ToolbarProps) {
  const { saving, setSaving } = props;
  let dispatch = useAppDispatch();
  function handleSliceTypeChange(e: { target: { value: any } }) {
    let newSliceType = e.target.value;
    let nvUpdateSliceType = props.nvUpdateSliceType;
    nvUpdateSliceType(newSliceType);
  }

  // let dragModes = ["Pan","Measurement","Contrast",'None'];
  let dragModes = [
    { value: "pan", label: "Zoom and Pan" },
    { value: "measurement", label: "Slice and Measurement" },
    { value: "contrast", label: "Slice and Contrast" },
    { value: "none", label: "Slice and None" },
    { value: "translate-slice", label: "None and Translate Slice" },
    { value: "angle-slice", label: "None and Rotate Slice" },
  ];
  let pipeline = useAppSelector((state) => state.result.activeJob?.pipeline_id);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {props.volumes[props.selectedVolume] !== undefined && (
        <Fragment>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyItems: "left",
              alignItems: "center",
              backgroundColor: "white",
              flexWrap: "wrap",
            }}
          >
            {/* Temporarily hide hamburger side menu */}
            {/* <IconButton
                        size={'small'}
                        onClick={props.toggleLayers}
                    >
                        <MenuIcon/>
                    </IconButton> */}

            <FormControl
              size="small"
              sx={{
                m: 2,
                minWidth: 120,
              }}
            >
              <InputLabel id="slice-type-label">Opened Volume</InputLabel>
              <Select
                labelId="slice-type-label"
                id="slice-type"
                value={props.selectedVolume}
                label="Opened Volume"
                onChange={(e) =>
                  props.setSelectedVolume(Number(e.target.value))
                }
              >
                {props.volumes.map((value, index) => {
                  return <MenuItem value={index}>{value.alias}</MenuItem>;
                })}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{
                m: 2,
                minWidth: 120,
              }}
            >
              <InputLabel id="slice-type-label">Orientation</InputLabel>
              <Select
                labelId="slice-type-label"
                id="slice-type"
                value={props.sliceType}
                label="Orientation"
                onChange={handleSliceTypeChange}
              >
                <MenuItem value={"axial"}>Axial</MenuItem>
                <MenuItem value={"coronal"}>Coronal</MenuItem>
                <MenuItem value={"sagittal"}>Sagittal</MenuItem>
                <MenuItem value={"multi"}>Multi</MenuItem>
                <MenuItem value={"3d"}>3D</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{
                m: 2,
                minWidth: 180,
                maxWidth: "100%",
              }}
            >
              <InputLabel
                id="drag-mode-label"
                sx={{
                  maxWidth: "unset",
                  overflow: "visible",
                  textOverflow: "clip",
                  whiteSpace: "nowrap",
                }}
              >
                Scroll and Right Click Drag
              </InputLabel>
              <Select
                labelId="drag-mode-label"
                id="drag-mode"
                value={props.dragMode}
                label="Scroll and Right Click Drag"
                onChange={(e) => {
                  console.log(e.target.value);
                  props.setDragMode(e.target.value);
                }}
              >
                {/* {dragModes.map((value, index) =>
                                <MenuItem key={index} value={value.toLowerCase()}>
                                    {value}
                                </MenuItem>
                            )} */}

                {dragModes.map((mode, index) => (
                  <MenuItem key={index} value={mode.value}>
                    {mode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{
                m: 2,
                minWidth: 120,
              }}
            >
              <InputLabel id="slice-type-label">Display Mode</InputLabel>
              <Select
                labelId="slice-type-label"
                id="slice-type"
                value={props.complexMode}
                label="Display Mode"
                onChange={(e) => props.setComplexMode(e.target.value)}
              >
                {props.complexOptions.map((value) => {
                  return (
                    <MenuItem value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* ROI Layer - commented out to hide from UI */}
            {/* <FormControl
              size="small"
              sx={{
                m: 2,
                minWidth: 120,
              }}
            >
              <InputLabel id="slice-type-label">ROI Layer</InputLabel>
              <Select
                labelId="slice-type-label"
                id="slice-type"
                value={props.selectedROI}
                label="Opened ROIs"
              >
                {props.rois.map((value, index) => {
                  return (
                    <MenuItem
                      value={index}
                      onClick={() => props.setSelectedROI(Number(index))}
                    >
                      {value.filename}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Button
              variant={"contained"}
              endIcon={
                saving && <CircularProgress sx={{ color: "white" }} size={20} />
              }
              onClick={() => {
                if (saving) return;
                props.saveROI(
                  async () => {
                    if (pipeline) await dispatch(getPipelineROI({ pipeline }));
                    setSaving(false);
                  },
                  () => {
                    setSaving(true);
                  },
                );
              }}
            >
              Save Drawing Layer
            </Button> */}
            <IconButton
              onClick={props.toggleSettings}
              style={{ marginLeft: "auto" }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyItems: "left",
              alignItems: "center",
              backgroundColor: "white",
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
              m={1}
            >
              <Typography
                style={{
                  marginRight: "auto",
                }}
              >
                Neurological
              </Typography>
              <Switch
                defaultChecked={false}
                checked={!props.radiological}
                onChange={props.toggleRadiological}
                sx={{ "& .MuiSwitch-thumb": { backgroundColor: "#1578A1" } }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
              m={1}
            >
              <Typography
                style={{
                  marginRight: "auto",
                }}
              >
                Show Crosshair
              </Typography>
              <Switch
                defaultChecked={false}
                checked={props.showCrosshair}
                onChange={props.toggleShowCrosshair}
                sx={{ "& .MuiSwitch-thumb": { backgroundColor: "#1578A1" } }}
              />
            </Box>

            {/* <Box
                        sx={{
                            display:'flex',
                            alignItems: 'center'
                        }}
                        m={1}
                    >
                        <Typography
                        >
                            Vertical Layout
                        </Typography>

                    </Box> */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
              m={1}
            >
              <Typography
                style={{
                  marginRight: "auto",
                }}
              >
                Show Color Bar
              </Typography>
              <Switch
                checked={props.showColorBar}
                onChange={props.toggleColorBar}
                sx={{ "& .MuiSwitch-thumb": { backgroundColor: "#1578A1" } }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
              m={1}
            >
              <Typography
                style={{
                  marginRight: "auto",
                }}
              >
                Labels Visible
              </Typography>
              <Switch
                defaultChecked={false}
                checked={props.labelsVisible}
                onChange={props.toggleLabelsVisible}
                sx={{ "& .MuiSwitch-thumb": { backgroundColor: "#1578A1" } }}
              />
            </Box>

            {props.showFovSlicesToggle ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
                m={1}
              >
                <Typography
                  style={{
                    marginRight: "auto",
                  }}
                >
                  Show Slices
                </Typography>
                <Switch
                  checked={props.showFovSlices ?? true}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    props.onShowFovSlicesChange?.(e.target.checked)
                  }
                  sx={{ "& .MuiSwitch-thumb": { backgroundColor: "#1578A1" } }}
                />
              </Box>
            ) : null}

            <Stack flexDirection={"row"} sx={{ m: 2 }}>
              <Tooltip title={"Reset Views"} placement={"top"}>
                <IconButton onClick={() => props.nv.resetScene()}>
                  <HomeIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={"Recenter Views"} placement={"top"}>
                <IconButton onClick={() => props.nv.recenter()}>
                  <CenterFocusStrongIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={"Reset Zoom"} placement={"top"}>
                <IconButton onClick={() => props.nv.resetZoom()}>
                  <ZoomInMapIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={"Reset Contrast"} placement={"top"}>
                <IconButton onClick={() => {
                    props.nv.setGamma(1.0); // engine reset
                    props.nv.onResetGamma?.(); // UI reset: bumps gammaKey + sets gamma=1.0
                    props.nv.resetContrast();
                    props.nv.setOpacity(props.selectedVolume, 1.0); // engine reset opacity
                    props.nv.onResetOpacity?.(); // UI reset: sets opacity slider to 1.0
                  }}>
                  <Brightness6Icon />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Spacer pushes zoom buttons to the far right */}
            <Box sx={{ flex: 1 }} />

            <Stack
              flexDirection={"row"}
              alignItems={"center"}
              sx={{ m: 2, gap: 0.5 }}
            >
              <Tooltip title={"Zoom Out"} placement={"top"}>
                <IconButton
                  onClick={() => {
                    const scene = props.nv.scene;
                    const current = scene.pan2Dxyzmm[3];
                    const next = Math.max(0.1, current - 0.1);
                    const delta = current - next;
                    scene.pan2Dxyzmm[3] = next;
                    const mm = props.nv.frac2mm(scene.crosshairPos);
                    scene.pan2Dxyzmm[0] += delta * mm[0];
                    scene.pan2Dxyzmm[1] += delta * mm[1];
                    scene.pan2Dxyzmm[2] += delta * mm[2];
                    props.nv.drawScene();
                  }}
                  size="small"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={"Zoom In"} placement={"top"}>
                <IconButton
                  onClick={() => {
                    const scene = props.nv.scene;
                    const current = scene.pan2Dxyzmm[3];
                    const next = current + 0.1;
                    const delta = current - next;
                    scene.pan2Dxyzmm[3] = next;
                    const mm = props.nv.frac2mm(scene.crosshairPos);
                    scene.pan2Dxyzmm[0] += delta * mm[0];
                    scene.pan2Dxyzmm[1] += delta * mm[1];
                    scene.pan2Dxyzmm[2] += delta * mm[2];
                    props.nv.drawScene();
                  }}
                  size="small"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Fragment>
      )}
    </Box>
  );
}
