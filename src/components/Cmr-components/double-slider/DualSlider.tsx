import * as React from 'react';
import { Box } from '@mui/material';

interface DualSliderProps {
  name: string;
  min: number;
  max: number;
  setMin?: (v: number) => void;
  setMax?: (v: number) => void;
  transform?: (x: number) => number;
  inverse?: (x: number) => number;
}

export const DualSlider: React.FC<DualSliderProps> = ({
  name,
  min,
  max,
  setMin,
  setMax,
  transform = x => x,
  inverse = x => x,
}) => {
  const [leftPos,  setLeftPos]  = React.useState(0);   // %
  const [rightPos, setRightPos] = React.useState(100); // %
  const [hover,    setHover]    = React.useState(false);

  const [minOverride, setMinOverride] = React.useState<number>();
  const [maxOverride, setMaxOverride] = React.useState<number>();

  if (minOverride !== undefined) min = minOverride;
  if (maxOverride !== undefined) max = maxOverride;

  const a = transform((max - min) * leftPos  / 100 + min);
  const b = transform((max - min) * rightPos / 100 + min);
  const left  = Math.min(a, b);
  const right = Math.max(a, b);

  /* ---------------- slider drag logic ---------------- */

  const ref = React.useRef<HTMLDivElement>(null);

  const startDrag = (
    e: React.MouseEvent<HTMLDivElement>,
    which: 'left' | 'right'
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const width  = ref.current?.offsetWidth ?? 1;

    const move = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / width) * 100;
      const raw   = (which === 'left' ? leftPos : rightPos) + delta;
      const pos   = Math.min(100, Math.max(0, raw));

      if (which === 'left') {
        setLeftPos(pos);
        const a = (max - min) * pos / 100 + min;
        const b = (max - min) * rightPos / 100 + min;
        setMin?.(Math.min(a, b));
        setMax?.(Math.max(a, b));
      } else {
        setRightPos(pos);
        const a = (max - min) * leftPos / 100 + min;
        const b = (max - min) * pos     / 100 + min;
        setMin?.(Math.min(a, b));
        setMax?.(Math.max(a, b));
      }
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  /* ---------------- number boxes ---------------- */

  const fmt = (v: number) =>
    Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(3).toUpperCase() : v.toFixed(3);

  const [leftEdit,  setLeftEdit]  = React.useState('');
  const [rightEdit, setRightEdit] = React.useState('');
  const [leftErr,   setLeftErr]   = React.useState(false);
  const [rightErr,  setRightErr]  = React.useState(false);
  const [leftFocus, setLeftFocus] = React.useState(false);
  const [rightFocus,setRightFocus]= React.useState(false);

  const leftBox  = leftFocus  ? leftEdit  : fmt(left);
  const rightBox = rightFocus ? rightEdit : fmt(right);

  /* ---------------- render ---------------- */

  return (
    <Box sx={{ display: 'flex', pl: 0.5, pr: 0.5 }} height={20}>
      <Box
        flex={0.322}
        fontSize={16}
        color="#3d3d3d"
        display="flex"
        alignItems="center"
        mb="1pt"
        sx={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {name}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row' }} flex={1}>
        {/* left numeric input */}
        <input
          style={{
            backgroundColor: '#f0f0f0',
            width: 45,
            borderRadius: 2,
            border: 'none',
            outline: 'none',
            padding: '0 3px',
            fontSize: 11,
            fontFamily: 'system-ui, sans-serif',
            color: leftErr ? 'red' : 'black',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
          }}
          value={leftBox}
          onFocus={e => {
            setLeftEdit(e.target.value);
            setLeftFocus(true);
          }}
          onChange={e => {
            setLeftErr(isNaN(Number(e.target.value)));
            setLeftEdit(e.target.value);
          }}
          onBlur={() => {
            const val = inverse(Number(leftEdit));
            if (isNaN(val)) return setLeftErr(true);
            setLeftFocus(false);
            setMin?.(val);
            let newMin = min;
            if (val < min) {
              setMinOverride(val);
              newMin = val;
            }
            setLeftPos(((val - newMin) / (max - newMin)) * 100);
          }}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />

        {/* slider */}
        <Box
          sx={{
            backgroundColor: '#f0f0f0',
            flex: 1,
            mx: 0.5,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            opacity: hover ? 0.75 : 1,
          }}
          ref={ref}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {/* left handle */}
          <Box
            sx={{
              position: 'absolute',
              left: `calc(${leftPos * 0.97}% - 10px)`,
              width: 20,
              height: '100%',
              cursor: 'ew-resize',
            }}
            onMouseDown={e => startDrag(e, 'left')}
          >
            <Box sx={{ position: 'absolute', left: 10, width: 2, height: '100%', bgcolor: 'black' }} />
          </Box>

          {/* right handle */}
          <Box
            sx={{
              position: 'absolute',
              right: `calc(${(100 - rightPos) * 0.97}% - 10px)`,
              width: 20,
              height: '100%',
              cursor: 'ew-resize',
            }}
            onMouseDown={e => startDrag(e, 'right')}
          >
            <Box sx={{ position: 'absolute', right: 10, width: 2, height: '100%', bgcolor: 'black' }} />
          </Box>
        </Box>

        {/* right numeric input */}
        <input
          style={{
            backgroundColor: '#f0f0f0',
            width: 45,
            borderRadius: 2,
            border: 'none',
            outline: 'none',
            padding: '0 3px',
            fontSize: 11,
            fontFamily: 'system-ui, sans-serif',
            color: rightErr ? 'red' : 'black',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
          }}
          value={rightBox}
          onFocus={e => {
            setRightEdit(e.target.value);
            setRightFocus(true);
          }}
          onChange={e => {
            setRightErr(isNaN(Number(e.target.value)));
            setRightEdit(e.target.value);
          }}
          onBlur={() => {
            const val = inverse(Number(rightEdit));
            if (isNaN(val)) return setRightErr(true);
            setRightFocus(false);
            setMax?.(val);
            let newMax = max;
            if (val > max) {
              setMaxOverride(val);
              newMax = val;
            }
            setRightPos(((val - min) / (newMax - min)) * 100);
          }}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </Box>
    </Box>
  );
};
