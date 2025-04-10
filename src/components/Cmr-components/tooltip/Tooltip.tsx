import { Tooltip } from 'antd';
import type { TooltipProps } from 'antd';
import './Tooltip.scss';

/** CloudMR-styled wrapper around Ant Design Tooltip */
const CmrTooltip: React.FC<TooltipProps> = props => <Tooltip {...props} />;

export default CmrTooltip;
