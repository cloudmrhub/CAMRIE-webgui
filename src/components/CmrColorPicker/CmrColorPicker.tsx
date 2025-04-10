import { useState } from 'react';
import { ChromePicker, ColorResult, RGBColor } from 'react-color';
import './CmrColorPicker.scss';

interface CmrColorPickerProps {
  color: RGBColor;
  onColorChange: (color: ColorResult) => void;
}

const CmrColorPicker: React.FC<CmrColorPickerProps> = ({ color, onColorChange }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="swatch" onClick={() => setVisible(!visible)}>
        <div
          className="color"
          style={{
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`,
          }}
        />
      </div>

      {visible && (
        <div className="popover">
          <div className="cover" onClick={() => setVisible(false)} />
          <ChromePicker color={color} onChange={onColorChange} />
        </div>
      )}
    </div>
  );
};

export default CmrColorPicker;
