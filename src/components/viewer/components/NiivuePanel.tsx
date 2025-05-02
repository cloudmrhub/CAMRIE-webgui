import React, { useEffect, useRef } from "react";
import { Box, Card, CardContent } from "@mui/material";

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

  useEffect(() => {
    nv.attachTo("niiCanvas");
    nv.opts.dragMode = nv.dragModes.pan;
  }, [nv]);

  useEffect(() => {
    nv.resizeListener();
    nv.setMultiplanarLayout(2);
    nv.setMultiplanarPadPixels(10);
    props.resampleImage();
  }, [displayVertical]);

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
        display: "flex",
        flexDirection: "row",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Left Column: Canvas & Drawing */}
      <Box
        sx={{
          width: "60%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          alignItems: 'center',         // Center horizontally
          justifyContent: 'flex-start', // Start from top
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
            height: "30pt",
            background: "black"
          }}
        />

        <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
          <canvas
            id="niiCanvas"
            ref={canvas}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </Box>

      </Box>

      {/* Right Column: Controls + Histogram + ROI Table */}
      <Box
        sx={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          ml: 1,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <Box
              id="controlDock"
              className="title"
              sx={{ width: "100%" }}
              ref={sliceControl}
            >
              Controls
            </Box>
            {["X", "Y", "Slice"].map((axis, i) => (
              <Slider
                key={axis}
                name={axis}
                min={mins[i]}
                max={maxs[i]}
                value={mms[i]}
                setValue={(val: number) => {
                  const pos = [...mms];
                  pos[i] = val;
                  nv.scene.crosshairPos = [
                    toRatio(pos[0], mins[0], maxs[0]),
                    toRatio(pos[1], mins[1], maxs[1]),
                    toRatio(pos[2], mins[2], maxs[2]),
                  ];
                  nv.drawScene();
                }}
              />
            ))}

            <DualSlider
              name="Values"
              max={nv?.volumes?.[0]?.robust_max ?? 1}
              min={nv?.volumes?.[0]?.robust_min ?? 0}
              key={props.rangeKey}
              setMin={(min) => {
                const volume = nv.volumes?.[0];
                if (!volume) return;
                volume.cal_min = min;
                nv.refreshLayers(volume, 0, nv.volumes.length);
                nv.drawScene();
                props.setMin(min);
              }}
              setMax={(max) => {
                const volume = nv.volumes?.[0];
                if (!volume) return;
                volume.cal_max = max;
                nv.refreshLayers(volume, 0, nv.volumes.length);
                nv.drawScene();
                props.setMax(max);
              }}
              transform={(x) => x / a + b}
              inverse={(y) => a * y - a * b}
            />
          </CardContent>
        </Card>

        <Box sx={{ height: "20%", mt: 2 }}>{props.layerList}</Box>

        <Box sx={{ flex: 1, mt: 2, minHeight: 0 }}>
          <Box
            ref={histogram}
            id={displayVertical ? "histoplotv" : "histoplot"}
            sx={{
              width: "100%",
              height: "44%",
              marginBottom: "20px",
            }}
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
            nv={props.nv}
            resampleImage={props.resampleImage}
            unpackROI={props.unzipAndRenderROI}
            zipAndSendROI={props.zipAndSendROI}
            setLabelAlias={props.setLabelAlias}
          />
        </Box>
      </Box>
    </Box>
  );
}
