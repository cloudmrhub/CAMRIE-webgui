import React, { useRef, useEffect, useState } from 'react'
import { Niivue, NVImage, NVMesh } from '@niivue/niivue'
import { Box, Divider, Tooltip, IconButton } from '@mui/material'
import { CmrCollapse, CmrPanel, CmrLabel, CmrCheckbox, CmrSelect } from "cloudmr-ux";
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import TKDualRange from '../tk-dualrange/TKDualRange';
import LocationTable from '../LocationTable';
import './OpenMedView.css';

// ---- Niivue "resetZoom" patch ----
declare module '@niivue/niivue' {
  interface Niivue {
    setCenteredZoom: (zoom: number) => void
    recenter: () => void
    resetZoom: () => void
  }
}

// resetZoom
if (!(Niivue as any).prototype.resetZoom) {
  (Niivue as any).prototype.resetZoom = function () {
    const zoom = 1
    const scene = (this as any).scene
    const zoomChange = scene.pan2Dxyzmm[3] - zoom
    scene.pan2Dxyzmm[3] = zoom

    const mm = (this as any).frac2mm(scene.crosshairPos)
    scene.pan2Dxyzmm[0] += zoomChange * mm[0]
    scene.pan2Dxyzmm[1] += zoomChange * mm[1]
    scene.pan2Dxyzmm[2] += zoomChange * mm[2]

    this.drawScene()
  }
}

// recenter
if (!(Niivue as any).prototype.recenter) {
  (Niivue as any).prototype.recenter = function () {
    const scene = (this as any).scene
    const currentZoom = scene.pan2Dxyzmm[3]
    scene.crosshairPos = [0.5, 0.5, 0.5]
      ; (this as any).setCenteredZoom
        ? this.setCenteredZoom(currentZoom)
        : (() => {
          scene.pan2Dxyzmm[0] = 0
          scene.pan2Dxyzmm[1] = 0
          scene.pan2Dxyzmm[2] = 0
          this.drawScene()
        })()
  }
}

export interface OpenMedViewProps {
  /** map from display name → URL */
  availableVolumes: Record<string, string>
  /** map from display name → URL for meshes */
  availableMeshes?: Record<string, string>
}

const allColorMaps = [
  'gray', 'hot',
  'warm', 'cool', 'plasma', 'viridis', 'inferno'
]

// Available mesh colors with friendly names
const meshColors = {
  'Green': [0, 1, 0, 1],
  'Red': [1, 0, 0, 1],
  'Blue': [0, 0, 1, 1],
  'Yellow': [1, 1, 0, 1],
  'Cyan': [0, 1, 1, 1],
  'Magenta': [1, 0, 1, 1],
  'White': [1, 1, 1, 1],
}

type WheelMode = 'slice' | 'zoom'
type ViewMode = 'combined' | 'axial' | 'coronal' | 'sagittal' | '3d'

const OpenMedView: React.FC<OpenMedViewProps> = ({ availableVolumes, availableMeshes = {} }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nv, setNv] = useState<Niivue | null>(null)

  // Volume states (single volume only)
  const [targetUrl, setTargetUrl] = useState<string>("")
  const targetImgRef = useRef<NVImage | null>(null)
  const [targetColorMap, setTargetColorMap] = useState<string>("gray")
  const [showTarget, setShowTarget] = useState<boolean>(true)

  // Mesh states
  const [meshUrl, setMeshUrl] = useState<string>("")
  const [meshColor, setMeshColor] = useState<string>("Green")
  const [meshOpacity, setMeshOpacity] = useState<number>(1.0)
  const [wireframe, setWireframe] = useState<boolean>(false)

  // View states
  const [viewMode, setViewMode] = useState<ViewMode>('combined')
  const [wheelMode, setWheelMode] = useState<WheelMode>('slice')
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true)
  const [showColorbar, setShowColorbar] = useState<boolean>(true)
  const [showRuler, setShowRuler] = useState<boolean>(false)
  const [showOrientCube, setShowOrientCube] = useState<boolean>(false)

  // Contrast (window) state (single image)
  const [tDomain, setTDomain] = useState<[number, number] | null>(null)
  const [tWindow, setTWindow] = useState<[number, number]>([0, 1])

  // Location Table parameters
  const [locationRows, setLocationRows] = useState<any[]>([]);
  const decimalPrecision = 3;

  const handleRecenter = React.useCallback(() => {
    nv?.recenter?.()
  }, [nv])

  const resetZoom = React.useCallback(() => {
    if (!nv) return
    nv.setPan2Dxyzmm([0, 0, 0, 1])
    nv.setScale(1)
    nv.drawScene()
  }, [nv])

  const resetContrast = () => {
    if (!nv) return;

    const resetOne = (img: any) => {
      if (!img) return null;

      const rMin = Number.isFinite(img?.robust_min)
        ? Number(img.robust_min)
        : Number.isFinite(img?.global_min)
          ? Number(img.global_min)
          : Number(img?.cal_min ?? 0);

      const rMax = Number.isFinite(img?.robust_max)
        ? Number(img.robust_max)
        : Number.isFinite(img?.global_max)
          ? Number(img.global_max)
          : Number(img?.cal_max ?? 1);

      img.cal_min = rMin;
      img.cal_max = rMax;

      (nv as any).onIntensityChange?.(img);
      const idx = Array.isArray((nv as any).volumes)
        ? (nv as any).volumes.indexOf(img)
        : -1;
      if (idx >= 0) (nv as any).refreshLayers?.(img, idx);

      return [rMin, rMax] as [number, number];
    };

    const tNew = resetOne(targetImgRef.current as any);
    if (tNew) setTWindow(tNew);

    nv.updateGLVolume();
    nv.drawScene();

    (nv as any).onResetContrast?.();
  };

  // initialize Niivue
  useEffect(() => {
    if (!canvasRef.current || nv) return

    const inst = new Niivue({
      show3Dcrosshair: showCrosshair,
      isColorbar: showColorbar,
      isRuler: showRuler,
      isOrientCube: showOrientCube,
      crosshairWidth: showCrosshair ? 1 : 0,
      textHeight: 0.04,
      colorbarHeight: 0.02
    } as any)

    inst.opts.loadingText = "";
    inst.attachToCanvas(canvasRef.current);
    (inst as any).hideText = true;

    (inst as any).onLocationChange = (data: any) => {
      const values = Array.isArray(data?.values) ? data.values : [];
      const p1 = values[0]
        ? { id: 'param1', name: 'Data', ...values[0] }
        : null;
      setLocationRows([p1].filter(Boolean) as any[]);
    };

    setNv(inst)
  }, [canvasRef, nv, showCrosshair, showColorbar, showRuler, showOrientCube])

  // Unified loader for (single) volume and meshes
  useEffect(() => {
    if (!nv) return;

    let cancelled = false;

    (async () => {
      setLocationRows([]);

      // reset refs
      targetImgRef.current = null;

      setTDomain(null);

      // Clear previous volumes & meshes
      nv.loadVolumes([]);
      nv.loadMeshes([]);

      const initWindowFromImage = (image: any) => {
        const gMin = Number.isFinite(image?.global_min) ? Number(image.global_min) : Number(image?.cal_min ?? 0);
        const gMax = Number.isFinite(image?.global_max) ? Number(image.global_max) : Number(image?.cal_max ?? 1);
        const rMin = Number.isFinite(image?.robust_min) ? Number(image.robust_min) : gMin;
        const rMax = Number.isFinite(image?.robust_max) ? Number(image.robust_max) : gMax;

        image.cal_min = rMin;
        image.cal_max = rMax;

        return { gMin, gMax, rMin, rMax };
      };

      // Load target
      if (targetUrl && showTarget) {
        let fileName = targetUrl.split('/').pop() || 'volume.nii.gz';
        fileName = fileName.split('?')[0];

        const img = await NVImage.loadFromUrl({ url: targetUrl, name: fileName });
        if (cancelled) return;

        (img as any).colormap = targetColorMap;
        nv.addVolume(img);

        const { gMin, gMax, rMin, rMax } = initWindowFromImage(img as any);
        setTDomain([gMin, gMax]);
        setTWindow([rMin, rMax]);

        targetImgRef.current = img;
      }

      // Mesh
      if (meshUrl) {
        const mesh = await NVMesh.loadFromUrl({
          url: meshUrl,
          name: meshUrl.split('/').pop()!,
          gl: nv.gl!,
        });
        const m = mesh as any;
        m.color = meshColors[meshColor as keyof typeof meshColors];
        m.opacity = meshOpacity;
        m.wireframe = wireframe;
        nv.addMesh(mesh);
      }

      if (cancelled) return;

      nv.updateGLVolume();
      nv.drawScene();

      applyViewMode();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    nv,
    targetUrl,
    targetColorMap,
    meshUrl,
    meshColor,
    meshOpacity,
    wireframe,
    showTarget,
  ]);

  // Apply window changes to the single volume
  useEffect(() => {
    if (!nv || !targetImgRef.current) return;
    const img: any = targetImgRef.current;
    img.cal_min = Math.min(tWindow[0], tWindow[1]);
    img.cal_max = Math.max(tWindow[0], tWindow[1]);
    nv.updateGLVolume();
    nv.drawScene();
  }, [nv, tWindow]);

  // toggle display options
  useEffect(() => {
    if (!nv) return
    nv.opts.crosshairWidth = showCrosshair ? 1 : 0
    nv.opts.show3Dcrosshair = showCrosshair
    nv.opts.isColorbar = showColorbar
    nv.opts.isRuler = showRuler
    nv.opts.isOrientCube = showOrientCube
    nv.updateGLVolume()
    nv.drawScene()
  }, [nv, showCrosshair, showColorbar, showRuler, showOrientCube])

  // update scroll behavior
  useEffect(() => {
    if (!nv) return

    nv.opts.dragMode =
      wheelMode === 'zoom' ? nv.dragModes.pan :
        wheelMode === 'slice' ? nv.dragModes.none :
          nv.opts.dragMode

    nv.drawScene()
  }, [nv, wheelMode])

  // apply view layouts
  const applyViewMode = () => {
    if (!nv) return
    const _nv = nv as any
    switch (viewMode) {
      case 'combined':
        _nv.setSliceType(_nv.sliceTypeMultiplanar)
        _nv.setMultiplanarLayout(2)
        _nv.opts.multiplanarEqualSize = true
        break
      case 'axial': _nv.setSliceType(_nv.sliceTypeAxial); break
      case 'coronal': _nv.setSliceType(_nv.sliceTypeCoronal); break
      case 'sagittal': _nv.setSliceType(_nv.sliceTypeSagittal); break
      case '3d': _nv.setSliceType(_nv.sliceTypeRender); break
    }
    _nv.drawScene()
  }
  useEffect(applyViewMode, [nv, viewMode])

  return (
    <CmrCollapse defaultActiveKey={[0]}>
      <CmrPanel
        header="Field of View"
        className="openmedview-panel"
        cardProps={{ className: 'm-0 p-0' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative', paddingBottom: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            {/* Volume controls */}
            {/* <div className="row mb-2 align-items-center">
              <CmrLabel><strong>Parameter Maps</strong></CmrLabel>
            </div> */}

            <div className="row mb-2 align-items-center">
              <div className="col-auto" style={{ width: '100px' }}>
                {/* <CmrCheckbox
                  defaultChecked={true}
                  checked={showTarget}
                  onChange={() => setShowTarget(v => !v)}
                  sx={{
                    "& .MuiCheckbox-root": {
                      color: "#1578A1!important",
                    },
                    "& .MuiCheckbox-root.Mui-checked": {
                      color: "#1578A1!important",
                    },
                  }}
                > */}
                <CmrLabel>Data:</CmrLabel>
                 
                {/* </CmrCheckbox> */}
              </div>

              <div className="col-auto">
                <CmrSelect
                  options={Object.entries(availableVolumes).map(([name, url]) => ({
                    label: name,
                    value: url,
                  }))}
                  value={targetUrl}
                  onChange={setTargetUrl}
                  primaryColor="#1578A1"
                  fullWidth
                />
              </div>

              <div className="col-auto">
                <CmrSelect
                  options={allColorMaps.map(cm => ({ label: cm, value: cm }))}
                  value={targetColorMap}
                  onChange={setTargetColorMap}
                  primaryColor="#1578A1"
                  sx={{ minWidth: 150 }}
                />
              </div>
            </div>

            {/* Mesh controls */}
            {availableMeshes && Object.keys(availableMeshes).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>Mesh</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label>Mesh:</label>
                  <select value={meshUrl} onChange={e => setMeshUrl(e.target.value)}>
                    <option value="">– None –</option>
                    {Object.entries(availableMeshes).map(([name, url]) =>
                      <option key={url} value={url}>{name}</option>
                    )}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label>Color:</label>
                  <select value={meshColor} onChange={e => setMeshColor(e.target.value)}>
                    {Object.keys(meshColors).map(color =>
                      <option key={color} value={color}>{color}</option>
                    )}
                  </select>

                  <label>Opacity:</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={meshOpacity}
                    onChange={e => setMeshOpacity(+e.target.value)}
                    style={{ width: '80px' }}
                  />

                  <label>
                    <input
                      type="checkbox"
                      checked={wireframe}
                      onChange={() => setWireframe(w => !w)}
                    /> Wireframe
                  </label>
                </div>
              </div>
            )}

            {/* View controls */}
            {/* <Divider variant="middle" sx={{ marginTop: '15pt', marginBottom: '10pt', color: 'gray' }} /> */}
{/* 
            <div className="row align-items-center" style={{ marginBottom: '10px' }}>
              <CmrLabel><strong>Display Options</strong></CmrLabel>
            </div> */}

            {/* contrast */}
            {/* {showTarget && tDomain && (
              <div className="row align-items-center" style={{ marginTop: 8, marginBottom: 8 }}>
                <div className="col-10">
                  <CmrLabel> Contrast (Parameter 1): </CmrLabel>
                  <TKDualRange
                    name="Contrast (Parameter 1):"
                    minDomain={tDomain[0]}
                    maxDomain={tDomain[1]}
                    valueLow={tWindow[0]}
                    valueHigh={tWindow[1]}
                    onChangeLow={(v) => setTWindow(([_, hi]) => [v, hi])}
                    onChangeHigh={(v) => setTWindow(([lo, _]) => [lo, v])}
                    accentColor="#580F8B"
                    precision={3}
                  />
                </div>
              </div>
            )} */}

            {/* view and mouse wheel */}
            <div className="row align-items-center" style={{ marginTop: '20px', marginBottom: 8 }}>
              <div className="col-auto">
                <CmrLabel>View:</CmrLabel>
              </div>

              <CmrSelect
                options={[
                  { label: 'Combined', value: 'combined' },
                  { label: 'Axial', value: 'axial' },
                  { label: 'Coronal', value: 'coronal' },
                  { label: 'Sagittal', value: 'sagittal' },
                  { label: '3D', value: '3d' },
                ]}
                value={viewMode}
                onChange={(val) => setViewMode(val as ViewMode)}
                sx={{ minWidth: 100 }}
                primaryColor="#1578A1"
              />

              <div className="col-auto">
                <CmrLabel>Mouse Wheel:</CmrLabel>
              </div>

              <CmrSelect
                options={[
                  { label: 'Slice', value: 'slice' },
                  { label: 'Zoom', value: 'zoom' },
                ]}
                value={wheelMode}
                onChange={(val) => setWheelMode(val as WheelMode)}
                sx={{ minWidth: 100 }}
                primaryColor="#1578A1"
              />
            </div>

            {/* checkboxes */}
            <div className='row'>
              <div>
                <CmrCheckbox checked={showCrosshair} onChange={() => setShowCrosshair(c => !c)}
                  sx={{
                    "& .MuiCheckbox-root": {
                      color: "#1578A1!important",
                    },
                    "& .MuiCheckbox-root.Mui-checked": {
                      color: "#1578A1!important",
                    },
                  }}>
                  Crosshair
                </CmrCheckbox>

                <CmrCheckbox checked={showColorbar} onChange={() => setShowColorbar(c => !c)}
                  sx={{
                    "& .MuiCheckbox-root": {
                      color: "#1578A1!important",
                    },
                    "& .MuiCheckbox-root.Mui-checked": {
                      color: "#1578A1!important",
                    },
                  }}>
                  Colorbar
                </CmrCheckbox>

                <CmrCheckbox checked={showRuler} onChange={() => setShowRuler(c => !c)}
                  sx={{
                    "& .MuiCheckbox-root": {
                      color: "#1578A1!important",
                    },
                    "& .MuiCheckbox-root.Mui-checked": {
                      color: "#1578A1!important",
                    },
                  }}>
                  Ruler
                </CmrCheckbox>

                <CmrCheckbox checked={showOrientCube} onChange={() => setShowOrientCube(c => !c)}
                  sx={{
                    "& .MuiCheckbox-root": {
                      color: "#1578A1!important",
                    },
                    "& .MuiCheckbox-root.Mui-checked": {
                      color: "#1578A1!important",
                    },
                  }}>
                  Orient Cube
                </CmrCheckbox>

                <Tooltip title="Reset Zoom">
                  <IconButton onClick={resetZoom}>
                    <ZoomInMapIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Recenter Views">
                  <IconButton onClick={handleRecenter}>
                    <CenterFocusStrongIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={'Reset Contrast'} placement={'right'}>
                  <IconButton onClick={resetContrast}>
                    <Brightness6Icon />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Location table (single param only) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <LocationTable
              tableData={locationRows[0] ? [locationRows[0]] : []}
              isVisible={true}
              decimalPrecision={decimalPrecision}
              label="Parameter 1"
              style={{
                width: '100%',
                height: '30pt',
                paddingTop: '10px',
                paddingLeft: '5px',
                color: 'white',
                background: 'black',
                fontSize: '14px',
              }}
            />
          </div>

          {/* fixed canvas height */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: "40vh", sm: "50vh", md: "70vh" },
              paddingTop: "10px",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
              onContextMenu={e => e.preventDefault()}
            />
          </Box>

          {/* Empty-state overlay */}
          {(!showTarget || !targetUrl) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
                marginTop: '15%'
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 20,
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                }}
              >
                Select data to display
              </div>
            </div>
          )}

          {/* Mesh display tip */}
          {meshUrl && viewMode !== '3d' && (
            <div style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Switch to 3D view to see the full mesh
            </div>
          )}
        </div>
      </CmrPanel>
    </CmrCollapse>
  )
}

export default OpenMedView
