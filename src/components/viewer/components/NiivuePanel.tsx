import React, { useEffect, useRef, useState } from "react";
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
    // <Box
    //   sx={{
    //     width: "100%",
    //     height: displayVertical ? undefined : height + 1,
    //     display: "flex",
    //     flexDirection: "row",
    //     justifyContent: "flex-end",
    //   }}
    // >
    //   {/* Control Panel */}
    //   <Box
    //     sx={{
    //       marginRight: 1,
    //       display: "flex",
    //       flex: 1,
    //       minWidth: "245px",
    //       flexDirection: "column",
    //     }}
    //   >
    //     <Box
    //       id="controlDock"
    //       className="title"
    //       sx={{ width: "100%" }}
    //       ref={sliceControl}
    //     >
    //       Controls
    //     </Box>

    //     {/* Axis Sliders */}
    //     {["X", "Y", "Slice"].map((axis, i) => (
    //       <Slider
    //         key={axis}
    //         name={axis}
    //         min={mins[i]}
    //         max={maxs[i]}
    //         value={mms[i]}
    //         setValue={(val: number) => {
    //           const pos = [...mms] as number[];
    //           pos[i] = val;
    //           nv.scene.crosshairPos = [
    //             toRatio(pos[0], mins[0], maxs[0]),
    //             toRatio(pos[1], mins[1], maxs[1]),
    //             toRatio(pos[2], mins[2], maxs[2]),
    //           ];
    //           nv.drawScene();
    //         }}
    //       />
    //     ))}

    //     {/* Value Range Slider */}
    //     <DualSlider
    //       name="Values"
    //       max={nv?.volumes?.[0]?.robust_max ?? 1}
    //       min={nv?.volumes?.[0]?.robust_min ?? 0}
    //       key={props.rangeKey}
    //       setMin={(min) => {
    //         const volume = nv.volumes?.[0];
    //         if (!volume) return;
    //         volume.cal_min = min;
    //         nv.refreshLayers(volume, 0, nv.volumes.length);
    //         nv.drawScene();
    //         props.setMin(min);
    //       }}
    //       setMax={(max) => {
    //         const volume = nv.volumes?.[0];
    //         if (!volume) return;
    //         volume.cal_max = max;
    //         nv.refreshLayers(volume, 0, nv.volumes.length);
    //         nv.drawScene();
    //         props.setMax(max);
    //       }}
    //       transform={(x) => x / a + b}
    //       inverse={(y) => a * y - a * b}
    //     />

    //     <Box sx={{ height: "70%", mt: 2 }}>{props.layerList}</Box>
    //   </Box>

    //   {/* Canvas & Location */}
    //   <Box
    //     sx={{
    //       width: displayVertical ? "100%" : height,
    //       height: displayVertical ? undefined : height + 1,
    //       aspectRatio: displayVertical ? 1 : undefined,
    //       maxHeight: height + 1,
    //       display: "flex",
    //       flexDirection: "column",
    //     }}
    //   >
    //     <LocationTable
    //       tableData={props.locationData}
    //       isVisible={true}
    //       decimalPrecision={props.decimalPrecision}
    //       showDistribution={displayVertical}
    //       style={{
    //         width: "100%",
    //         height: "20pt",
    //         color: "white",
    //       }}
    //     />
    //     <canvas id="niiCanvas" ref={canvas} height="100%" width="100%" />
    //   </Box>

    //   {/* Drawing and ROI Table */}
    //   <Box
    //     sx={{
    //       width: "40%",
    //       display: displayVertical ? "none" : "flex",
    //       height: "100%",
    //       ml: 1,
    //       flexDirection: "column",
    //     }}
    //   >
    //     <DrawToolkit {...props.drawToolkitProps} style={{ height: "30pt" }} />

    //     <Box
    //       ref={histogram}
    //       id="histoplot"
    //       sx={{ width: "100%", height: "44%" }}
    //     />

    //     <ROITable
    //       pipelineID={props.pipelineID}
    //       rois={props.rois}
    //       style={{
    //         width: "100%",
    //         height: "100%",
    //         display: "flex",
    //         flexDirection: "column",
    //       }}
    //       nv={nv}
    //       resampleImage={props.resampleImage}
    //       unpackROI={props.unzipAndRenderROI}
    //       zipAndSendROI={props.zipAndSendROI}
    //       setLabelAlias={props.setLabelAlias}
    //     />
    //   </Box>
    // </Box>
    // <Box
    //   sx={{
    //     width: "100%",
    //     height: "100%",
    //     display: "flex",
    //     flexDirection: "column", // change to column
    //   }}
    // >
    //   {/* Control Panel */}
    //   <Box
    //     sx={{
    //       width: "100%",
    //       display: "flex",
    //       flexDirection: { xs: "column", md: "row" },
    //       gap: 2,               // add space between the two columns
    //       mb: 2,
    //     }}
    //   >
    //     {/* First Column - Card with Controls + Value Range */}
    //     <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
    //       <CardContent>
    //         <Box
    //           sx={{
    //             width: "100%",
    //             display: "flex",
    //             flexDirection: "column",
    //             minHeight: "100px",
    //             marginBottom: 1,
    //           }}
    //         >
    //           <Box
    //             id="controlDock"
    //             className="title"
    //             sx={{ width: "100%" }}
    //             ref={sliceControl}
    //           >
    //             Controls
    //           </Box>

    //           {/* Axis Sliders */}
    //           {["X", "Y", "Slice"].map((axis, i) => (
    //             <Slider
    //               key={axis}
    //               name={axis}
    //               min={mins[i]}
    //               max={maxs[i]}
    //               value={mms[i]}
    //               setValue={(val: number) => {
    //                 const pos = [...mms] as number[];
    //                 pos[i] = val;
    //                 nv.scene.crosshairPos = [
    //                   toRatio(pos[0], mins[0], maxs[0]),
    //                   toRatio(pos[1], mins[1], maxs[1]),
    //                   toRatio(pos[2], mins[2], maxs[2]),
    //                 ];
    //                 nv.drawScene();
    //               }}
    //             />
    //           ))}

    //           {/* Value Range Slider */}
    //           <DualSlider
    //             name="Values"
    //             max={nv?.volumes?.[0]?.robust_max ?? 1}
    //             min={nv?.volumes?.[0]?.robust_min ?? 0}
    //             key={props.rangeKey}
    //             setMin={(min) => {
    //               const volume = nv.volumes?.[0];
    //               if (!volume) return;
    //               volume.cal_min = min;
    //               nv.refreshLayers(volume, 0, nv.volumes.length);
    //               nv.drawScene();
    //               props.setMin(min);
    //             }}
    //             setMax={(max) => {
    //               const volume = nv.volumes?.[0];
    //               if (!volume) return;
    //               volume.cal_max = max;
    //               nv.refreshLayers(volume, 0, nv.volumes.length);
    //               nv.drawScene();
    //               props.setMax(max);
    //             }}
    //             transform={(x) => x / a + b}
    //             inverse={(y) => a * y - a * b}
    //           />
    //         </Box>
    //       </CardContent>
    //     </Card>

    //     {/* Second Column - Layer List */}
    //     <Box sx={{ flex: 1 }}>
    //       {props.layerList}
    //     </Box>
    //   </Box>


    //   {/* Canvas & Location */}
    //   <Box
    //     sx={{
    //       width: "100%",
    //       height: "500px",
    //       aspectRatio: displayVertical ? 1 : undefined,
    //       maxHeight: height + 1,
    //       display: "flex",
    //       flexDirection: "column",
    //       mb: 3
    //     }}
    //   >
    //     <LocationTable
    //       tableData={props.locationData}
    //       isVisible={true}
    //       decimalPrecision={props.decimalPrecision}
    //       showDistribution={displayVertical}
    //       style={{
    //         width: "100%",
    //         height: "20pt",
    //         color: "white",
    //       }}
    //     />
    //     <canvas id="niiCanvas" ref={canvas} height="100%" width="100%" />
    //   </Box>

    //   {/* Drawing and ROI Table */}
    //   <Box
    //     sx={{
    //       width: "100%",
    //       minHeight: "300px",
    //       display: "flex",
    //       flexDirection: "column",
    //       marginTop: 1,
    //     }}
    //   >
    //     <DrawToolkit {...props.drawToolkitProps} style={{ height: "30pt" }} />

    //     <Box
    //       ref={histogram}
    //       id="histoplot"
    //       sx={{
    //         width: "100%",
    //         height: "200px", // Size of histogram
    //       }}
    //     />

    //     <ROITable
    //       pipelineID={props.pipelineID}
    //       rois={props.rois}
    //       style={{
    //         width: "100%",
    //         flexGrow: 1,
    //         display: "flex",
    //         flexDirection: "column",
    //       }}
    //       nv={nv}
    //       resampleImage={props.resampleImage}
    //       unpackROI={props.unzipAndRenderROI}
    //       zipAndSendROI={props.zipAndSendROI}
    //       setLabelAlias={props.setLabelAlias}
    //     />
    //   </Box>

    // </Box>

    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Control Panel */}
      {/* Control Panel */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        {/* First Column - Card with Controls + Value Range */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card
            variant="outlined"
            sx={{
              width: "100%",  // ✅ fill full width of its 50% container
              height: "100%", // ✅ fill height nicely if needed
              p: 2,
              boxSizing: "border-box",
            }}
          >
            <CardContent sx={{ padding: 0 }}>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "100px",
                  marginBottom: 1,
                }}
              >
                <Box
                  id="controlDock"
                  className="title"
                  sx={{ width: "100%" }}
                  ref={sliceControl}
                >
                  Controls
                </Box>

                {/* Axis Sliders */}
                {["X", "Y", "Slice"].map((axis, i) => (
                  <Slider
                    key={axis}
                    name={axis}
                    min={mins[i]}
                    max={maxs[i]}
                    value={mms[i]}
                    setValue={(val: number) => {
                      const pos = [...mms] as number[];
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

                {/* Value Range Slider */}
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
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Second Column - Layer List */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0, // ✅ prevents shrinking too much
            display: "flex",
            flexDirection: "column",
          }}
        >
          {props.layerList}
        </Box>
      </Box>


      {/* Viewer and Sidebar (split horizontally) */}
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          gap: 2,
        }}
      >
        {/* Left side - Canvas and Location */}
        <Box
          sx={{
            flex: 2, // larger part for canvas
            display: "flex",
            flexDirection: "column",
            backgroundColor: "black",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box sx={{ height: "20pt", width: "100%" }}>
            <LocationTable
              tableData={props.locationData}
              isVisible={true}
              decimalPrecision={props.decimalPrecision}
              showDistribution={displayVertical}
              style={{
                width: "100%",
                height: "100%",
                color: "white",
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <canvas
              id="niiCanvas"
              ref={canvas}
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
        </Box>

        {/* Right side - Draw Toolkit + ROI Table */}
        <Box
          sx={{
            flex: 2, // smaller side
            minWidth: "300px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DrawToolkit {...props.drawToolkitProps} style={{ height: "30pt" }} />

          <Box
            ref={histogram}
            id="histoplot"
            sx={{
              width: "100%",
              height: "200px", // Size of histogram
              mt: 2,
            }}
          />

          <ROITable
            pipelineID={props.pipelineID}
            rois={props.rois}
            style={{
              width: "100%",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              marginTop: 2,
            }}
            nv={nv}
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
