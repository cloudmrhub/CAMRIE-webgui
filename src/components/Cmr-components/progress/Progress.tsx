import { Progress } from 'antd';
import type { ProgressProps } from 'antd';
import './Progress.scss';

const CmrProgress: React.FC<ProgressProps> = ({
  style,
  ...rest
}) => (
  <Progress
    style={{ marginBottom: 5, ...style }}
    {...rest}
  />
);

export default CmrProgress;
