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
  onFinalize?: () => void;
}


export const InvertibleDualSlider: React.FC<InvertibleDualSliderProps> = ({
  name,
  min,
  max,
  setMin,
  setMax,
  transform = x => x,
  onFinalize,
}) => {
  const [leftPos, setLeftPos] = React.useState(0);
  const [rightPos, setRightPos] = React.useState(100);

  const effMin = min;
  const effMax = max;

  React.useEffect(() => {
    setMin?.(min);
    setMax?.(max);
    setLeftPos(0);
    setRightPos(100);
  }, [min, max]);

  const trackRef = React.useRef<HTMLDivElement>(null);

  // you could remove this entirely if it's not connected to the JSX yet
  const startDrag = (
    e: React.MouseEvent<HTMLDivElement>,
    which: 'left' | 'right'
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const width = trackRef.current?.offsetWidth ?? 1;

    const move = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / width) * 100;
      const raw = (which === 'left' ? leftPos : rightPos) + delta;
      const pos = Math.min(100, Math.max(0, raw));

      if (which === 'left') {
        setLeftPos(pos);
        const a = (effMax - effMin) * pos / 100 + effMin;
        const b = (effMax - effMin) * rightPos / 100 + effMin;
        setMin?.(Math.min(a, b));
        setMax?.(Math.max(a, b));
      } else {
        setRightPos(pos);
        const a = (effMax - effMin) * leftPos / 100 + effMin;
        const b = (effMax - effMin) * pos / 100 + effMin;
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

      {/* slider track & input boxes would go here */}
    </Box>
  );
};
