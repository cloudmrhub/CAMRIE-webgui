import * as React from 'react';
import { Box } from '@mui/material';

interface SliderProps {
  name: string;
  min: number;
  max: number;
  value?: number;
  setValue?: (v: number) => void;
  transform?: (x: number) => number;
  inverse?: (x: number) => number;
}

export const Slider: React.FC<SliderProps> = ({
  name,
  min,
  max,
  value,
  setValue,
  transform = x => x,
  inverse   = x => x,
}) => {
  /* ---------- state ---------- */
  const [sliderPos, setSliderPos] = React.useState(50);   // %
  const trackRef = React.useRef<HTMLDivElement>(null);
  const posRef   = React.useRef(sliderPos);               // live value for drag

  /* ---------- sync when parent supplies a value ---------- */
  React.useEffect(() => {
    if (value !== undefined) {
      const p = ((value - min) / (max - min)) * 100;
      setSliderPos(p);
      posRef.current = p;
    }
  }, [value, min, max]);

  /* ---------- drag logic ---------- */
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const width  = trackRef.current?.offsetWidth ?? 1;

    const move = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / width) * 100;
      const raw   = posRef.current + delta;
      const p     = Math.min(100, Math.max(0, raw));

      posRef.current = p;
      setSliderPos(p);
      const newVal = transform((max - min) * p / 100 + min);
      setValue?.(newVal);
    };

    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
      window.removeEventListener('blur', stop);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
    window.addEventListener('blur', stop);
  };

  /* ---------- numeric input ---------- */
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState('');
  const [err, setErr] = React.useState(false);

  const fmt = (v: number) =>
    Math.abs(v) < 0.01 && v !== 0
      ? v.toExponential(3).toUpperCase()
      : v.toFixed(3);

  const current = transform((max - min) * sliderPos / 100 + min);
  const display = editing ? editText : fmt(current);

  /* ---------- render ---------- */
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5, mb: 0.5 }} height={20}>
      <Box
        flex={0.77}
        fontSize={16}
        color="#3d3d3d"
        fontFamily="system-ui, sans-serif"
      >
        {name}
      </Box>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* track */}
        <Box
          ref={trackRef}
          onMouseDown={startDrag}
          sx={{
            flex: 1,
            mx: 0.5,
            backgroundColor: '#f0f0f0',
            borderRadius: 1,
            position: 'relative',
          }}
        >
          {/* handle */}
          <Box
            sx={{
              position: 'absolute',
              left: `calc(${sliderPos * 0.98}% - 10px)`,
              width: 20,
              height: '100%',
              cursor: 'ew-resize',
            }}
          >
            <Box sx={{ position: 'absolute', left: 10, width: 2, height: '100%', bgcolor: 'black' }} />
          </Box>
        </Box>

        {/* input */}
        <input
          style={{
            width: 45,
            background: '#f0f0f0',
            border: 'none',
            borderRadius: 2,
            outline: 'none',
            padding: '0 3px',
            lineHeight: '20px',
            fontSize: 11,
            fontFamily: 'system-ui, sans-serif',
            color: err ? 'red' : 'black',
          }}
          value={display}
          onFocus={e => {
            setEditText(e.target.value);
            setEditing(true);
          }}
          onChange={e => {
            setErr(isNaN(Number(e.target.value)));
            setEditText(e.target.value);
          }}
          onBlur={e => {
            const val = inverse(Number(editText));
            if (isNaN(val)) return e.preventDefault();
            setEditing(false);
            setValue?.(val);
          }}
          onKeyDown={e => e.key === 'Enter' && !err && (e.target as HTMLInputElement).blur()}
        />
      </Box>
    </Box>
  );
};
