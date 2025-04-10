import React, {useState} from "react"
import {Box} from "@mui/material"
import LocationTable from "./LocationTable";
import {ROITable} from "../../Rois.tsx";
import {DrawToolkit, DrawToolkitProps} from "./DrawToolKit";
import GUI from 'lil-gui';
import "./Toolbar.scss";
import {DualSlider} from "../../Cmr-components/double-slider/DualSlider";
import {Slider} from "../../Cmr-components/gui-slider/Slider";


interface NiivuePanelProps{
    nv:any;
    displayVertical:boolean;
    pipelineID:string;
    locationTableVisible: boolean;
    locationData:any[];
    decimalPrecision: number;
    drawToolkitProps: DrawToolkitProps;
    resampleImage:()=>void;
    layerList: React.ComponentProps<any>[];
    mins: number[];
    maxs: number[];
    mms: number[];
    rois: {}[];
    min: number;
    max:number;
    setMin:(min:number)=>void;
    setMax:(max:number)=>void;

    zipAndSendROI:(url:string,filename:string,blob:Blob)=>Promise<void>;
    unzipAndRenderROI:(url:string)=>Promise<void>;
    setLabelAlias:(label:string|number,alias:string)=>void;

    transformFactors: {a:number,b:number};
    rangeKey: number;
}


function toRatio(val:number,min:number,max:number){
    return (val-min)/(max-min);
}

export function NiivuePanel (props:NiivuePanelProps) {
    const sliceControl = React.useRef(null);
	const canvas = React.useRef(null)
    const histogram = React.useRef<HTMLElement>(null);
    const {mins,maxs,mms} = props;
    // const {gui} = createGUI(props.nv);

    let height = window.innerHeight*0.75;
    // This hook is for initialization, called only once
    React.useEffect(()=>{
        props.nv.attachTo('niiCanvas');
        props.nv.opts.dragMode=props.nv.dragModes.pan;
    },[canvas]);
    // This hook is called when show distribution state changed
	React.useEffect(() => {
        props.nv.resizeListener();
        props.nv.setMultiplanarLayout(2);
        props.nv.setMultiplanarPadPixels(10);
        props.resampleImage();
    }, [props.displayVertical,window.innerWidth,window.innerHeight]);

    React.useEffect(()=>{
        setTimeout(()=>{
            props.nv.resizeListener();
            props.nv.setMultiplanarLayout(2);
            props.nv.setMultiplanarPadPixels(10);
            props.resampleImage();
        },300)
    },[])

    React.useEffect(() => {
        if(!props.displayVertical)
            props.resampleImage();
        // histogram.current?.addEventListener('resize',()=>props.resampleImage());
    }, [histogram]);


    const [pause, pauseUpdate] = React.useState(false);
    // React.useEffect(()=>{
    //     document.getElementById('controlDock')?.appendChild(gui.domElement);
    // },[sliceControl]);

    // React.useEffect(()=>{
    //     controllerX.min(mins[0]).max(maxs[0]).setValue(mms[0]);
    //     controllerY.min(mins[1]).max(maxs[1]).setValue(mms[1]);
    //     controllerZ.min(mins[2]).max(maxs[2]).setValue(mms[2]);
    // },[mins,maxs,props.locationData])

    const [rangeMin,setRangeMin] = useState( undefined);
    const [rangeMax,setRangemax] = useState( undefined);


    //Transform factors are applied when scientific notation for voxel values become necessary
    const {a,b} = props.transformFactors;
	return (
		<Box style={{width:'100%',height:props.displayVertical?undefined:height+1,display:'flex',flexDirection:'row', justifyContent:"flex-end"}}>
            <Box sx={{marginRight:'8px'}} style={{display:'flex', flex:1, minWidth:'245px',flexDirection:'column'}}>
                <Box id={"controlDock"} className={'title'} style={{width:'100%'}}  ref={sliceControl}>
                    Controls
                </Box>
                <Slider name={'X'} min={mins[0]} max={maxs[0]} value={mms[0]} setValue={(val:number)=>{
                    props.nv.scene.crosshairPos = [toRatio(val, mins[0], maxs[0]),
                        toRatio(mms[1], mins[1], maxs[1]),
                        toRatio(mms[2], mins[2], maxs[2])];
                    // The following code are taken from Niivue source to change
                    // crosshair location imperatively, in the future shall be replaced with Niivue
                    // official API if otherwise supported
                    props.nv.drawScene();
                }}/>
                <Slider name={'Y'} min={mins[1]} max={maxs[1]} value={mms[1]} setValue={(val:number)=>{
                    props.nv.scene.crosshairPos = [toRatio(mms[0], mins[0], maxs[0]),
                        toRatio(val, mins[1], maxs[1]),
                        toRatio(mms[2], mins[2], maxs[2])];
                    // The following code are taken from Niivue source to change
                    // crosshair location imperatively, in the future shall be replaced with Niivue
                    // official API if otherwise supported
                    props.nv.drawScene();
                }}/>
                <Slider name={'Slice'} min={mins[2]} max={maxs[2]} value={mms[2]} setValue={(val:number)=>{
                    props.nv.scene.crosshairPos = [toRatio(mms[0], mins[0], maxs[0]),
                        toRatio(mms[1], mins[1], maxs[1]),
                        toRatio(val, mins[2], maxs[2])];
                    // The following code are taken from Niivue source to change
                    // crosshair location imperatively, in the future shall be replaced with Niivue
                    // official API if otherwise supported
                    props.nv.drawScene();
                }}/>
                <DualSlider name={'Values'}
                            max={props.nv.volumes[0]?props.nv.volumes[0].robust_max:1}
                            min={props.nv.volumes[0]?props.nv.volumes[0].robust_min:0}
                            setMin={(min)=>{
                                let volume = props.nv.volumes[0];
                                if(volume == undefined){
                                    return;
                                }
                                volume.cal_min = min;
                                props.nv.refreshLayers(props.nv.volumes[0], 0, props.nv.volumes.length)
                                props.nv.drawScene()
                                props.setMin(min)
                            }}
                            key={props.rangeKey}
                            setMax={(max)=>{
                                let volume = props.nv.volumes[0];
                                if(volume == undefined){
                                    return;
                                }
                                volume.cal_max = max;
                                props.nv.refreshLayers(props.nv.volumes[0], 0, props.nv.volumes.length)
                                props.nv.drawScene()
                                props.setMax(max)
                            }}
                            transform={x => x/a + b}
                            inverse={y => a * y - a*b}
                />
                <Box style={{height:'70%', marginTop:20}}>
                    {props.layerList}
                </Box>
            </Box>
            <Box
                sx={{
                    width:props.displayVertical?'100%':height,
                    height: (props.displayVertical?undefined:height+1),
                    aspectRatio:props.displayVertical?1:undefined,
                    maxHeight:height+1,
                    display:'flex',
                    flexDirection:'column',
                }}
            >
                <LocationTable
                    tableData={props.locationData}
                    isVisible={true}
                    decimalPrecision={props.decimalPrecision}
                    showDistribution={props.displayVertical}
                    style={{width:'100%',height:'20pt', color:'white'}}
                />
                <canvas id={'niiCanvas'} ref={canvas} height={'100%'} width={'100%'} />
            </Box>
            <Box sx={{width: '40%',
                display:(props.displayVertical)?'none':'flex',
                height:'100%', marginLeft:1, flexDirection:'column'}}>
                <DrawToolkit {...props.drawToolkitProps}
                     style={{height:'30pt'}} />
                <Box
                    ref={histogram}
                    id={'histoplot'}
                    style={{
                        width:'100%',
                        height: '44%'
                    }}
                >
                </Box>

                <ROITable
                    pipelineID={props.pipelineID}
                    rois={props.rois}
                    style={{
                        width:'100%',
                        height:'50%',
                        display:'flex',
                        flexDirection:'column'
                    }}
                    nv={props.nv}
                    resampleImage={props.resampleImage}
                    unpackROI={props.unzipAndRenderROI}
                    zipAndSendROI={props.zipAndSendROI}
                    setLabelAlias={props.setLabelAlias}
                />
            </Box>
        </Box>
	)
}


function createGUI(nv:any){
    const element = document.getElementById('controlDock');
    if (element?.firstChild) {
        element.innerHTML='';
    }
    const gui = new GUI({
        container: (document.getElementById( 'controlDock' )as HTMLElement) });
    const myObject = {
        xSlice: 0,
        ySlice: 1,
        zSlice: 2,
        min: 0,
        max: 1
    };
    return {gui};
}

