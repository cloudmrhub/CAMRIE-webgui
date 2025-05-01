import React, { useEffect, useRef, useState } from "react";
import { Box, Card, CardContent, Grid } from "@mui/material";

import LocationTable from "./LocationTable";
import { ROITable } from "../../Rois";
import { DrawToolkit, DrawToolkitProps } from "./DrawToolKit";
import { DualSlider } from "../../Cmr-components/double-slider/DualSlider";
import { Slider } from "../../Cmr-components/gui-slider/Slider";

interface NiivuePanelProps {
  nv: any;
  displayVertical: boolean;
  pipelineID: string;
  locationTableVisible: boolean;
  locationData: any[];
  decimalPrecision: number;
  drawToolkitProps: DrawToolkitProps;
  resampleImage: () => void;
  layerList: React.ReactNode[];
  mins: number[];
  maxs: number[];
  mms: number[];
  rois: {}[];
  min: number;
  max: number;
  setMin: (min: number) => void;
  setMax: (max: number) => void;

  zipAndSendROI: (url: string, filename: string, blob: Blob) => Promise<void>;
  unzipAndRenderROI: (url: string) => Promise<void>;
  setLabelAlias: (label: string | number, alias: string) => void;

  transformFactors: { a: number; b: number };
  rangeKey: number;
}

function toRatio(val: number, min: number, max: number): number {
  return (val - min) / (max - min);
}

export function NiivuePanel(props: NiivuePanelProps) {
  const sliceControl = useRef(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const histogram = useRef<HTMLDivElement>(null);
  const { mins, maxs, mms, nv, transformFactors, displayVertical } = props;
  const { a, b } = transformFactors;

  const [height, setHeight] = useState(window.innerHeight * 0.75);

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight * 0.75);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    nv.attachTo("niiCanvas");
    nv.opts.dragMode = nv.dragModes.pan;
  }, [nv]);

  useEffect(() => {
    nv.resizeListener();
    nv.setMultiplanarLayout(2);
    nv.setMultiplanarPadPixels(10);
    props.resampleImage();
  }, [displayVertical, height]);

  useEffect(() => {
    setTimeout(() => {
      nv.resizeListener();
      nv.setMultiplanarLayout(2);
      nv.setMultiplanarPadPixels(10);
      props.resampleImage();
    }, 300);
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: displayVertical ? undefined : height + 1,
        display: "flex",
        flexDirection: "row",
        // justifyContent: "flex-end",
      }}
    >
 

      {/* Canvas & Location & Drawing */}
      <Box
        sx={{
          width: displayVertical ? "100%" : "60%",
          height: displayVertical ? undefined : height + 1,
          aspectRatio: displayVertical ? 1 : undefined,
          maxHeight: height + 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DrawToolkit {...props.drawToolkitProps} style={{ height: "30pt" }} />
        <LocationTable
          tableData={props.locationData}
          isVisible={true}
          decimalPrecision={props.decimalPrecision}
          showDistribution={displayVertical}
          style={{
            width: "100%",
            marginTop: "15px",
            height: "30pt",
            color: "white",
          }}
        />
        <canvas id="niiCanvas" ref={canvas} height="100%" width="100%" />
      </Box>

      {/* ROI Table */}
      <Box
        sx={{
          width: "40%",
          display: displayVertical ? "none" : "flex",
          height: "100%",
          ml: 1,
          flexDirection: "column",
        }}
      >

        <Box
          ref={histogram}
          id="histoplot"
          sx={{ width: "100%", height: "44%", marginBottom: "20px" }}
        />

        <ROITable
          pipelineID={props.pipelineID}
          rois={props.rois}
          style={{
            width: "100%",
            height: "50%",
            display: "flex",
            flexDirection: "column",
          }}
          nv={nv}
          resampleImage={props.resampleImage}
          unpackROI={props.unzipAndRenderROI}
          zipAndSendROI={props.zipAndSendROI}
          setLabelAlias={props.setLabelAlias}
        />
      </Box>

    </Box>
  );
}
