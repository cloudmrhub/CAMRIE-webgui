import { Slider } from 'antd';
import type { SliderSingleProps } from 'antd';
import './Slider.scss';

export type CmrSliderProps = SliderSingleProps;

/** One‑dimensional Ant Design slider with CloudMR styling */
const CmrSlider: React.FC<CmrSliderProps> = props => (
  <Slider {...props} />
);

export default CmrSlider;
