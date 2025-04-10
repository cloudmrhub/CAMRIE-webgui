import * as React from 'react';
import { Box } from '@mui/material';

interface InvertibleDualSliderProps {
  name: string;
  min: number;
  max: number;
  setMin?: (v: number) => void;
  setMax?: (v: number) => void;
  reverse?: boolean;
  transform?: (x: number) => number;
  inverse?: (x: number) => number;
  onFinalize?: () => void;
}

export const InvertibleDualSlider: React.FC<InvertibleDualSliderProps> = ({
  name,
  min,
  max,
  setMin,
  setMax,
  reverse = false,
  transform = x => x,
  inverse = x => x,
  onFinalize,
}) => {
  /* ---------- state ---------- */
  const [leftPos,  setLeftPos]  = React.useState(0);   // %
  const [rightPos, setRightPos] = React.useState(100); // %
  const [hover,    setHover]    = React.useState(false);

  const [minOverride, setMinOverride] = React.useState<number>();
  const [maxOverride, setMaxOverride] = React.useState<number>();

  /* ---------- derived values ---------- */
  const effMin = minOverride ?? min;
  const effMax = maxOverride ?? max;

  const a = transform((effMax - effMin) * leftPos  / 100 + effMin);
  const b = transform((effMax - effMin) * rightPos / 100 + effMin);
  const left  = Math.min(a, b);
  const right = Math.max(a, b);

  /* ---------- one‑time init when min/max change ---------- */
  React.useEffect(() => {
    setMin?.(min);
    setMax?.(max);
    setLeftPos(0);
    setRightPos(100);
  }, [min, max]); // runs only when caller changes the bounds

  /* ---------- slider drag ---------- */
  const trackRef = React.useRef<HTMLDivElement>(null);

  const startDrag = (
    e: React.MouseEvent<HTMLDivElement>,
    which: 'left' | 'right'
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const width  = trackRef.current?.offsetWidth ?? 1;

    const move = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / width) * 100;
      const raw   = (which === 'left' ? leftPos : rightPos) + delta;
      const pos   = Math.min(100, Math.max(0, raw));

      if (which === 'left') {
        setLeftPos(pos);
        const a = (effMax - effMin) * pos / 100 + effMin;
        const b = (effMax - effMin) * rightPos / 100 + effMin;
        setMin?.(Math.min(a, b));
        setMax?.(Math.max(a, b));
      } else {
        setRightPos(pos);
        const a = (effMax - effMin) * leftPos / 100 + effMin;
        const b = (effMax - effMin) * pos     / 100 + effMin;
        setMin?.(Math.min(a, b));
        setMax?.(Math.max(a, b));
      }
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      onFinalize?.();
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  /* ---------- number‑box helpers ---------- */
  const fmt = (v: number) =>
    Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(3).toUpperCase() : v.toFixed(3);

  /* (…input boxes, highlight bar, handles unchanged — just update names/refs/types as above…) */

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, pr: 0.5 }} height={27}>
      {name && (
        <Box
          mr="5pt"
          fontSize={16}
          color="#fff"
          fontFamily="system-ui, sans-serif"
        >
          {name}
        </Box>
      )}

      {/* slider & inputs go here (same JSX as your original, but with
          ref={trackRef} on the track div and startDrag typed) */}
    </Box>
  );
};
