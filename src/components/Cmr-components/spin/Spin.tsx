import { Spin } from 'antd';
import type { SpinProps } from 'antd';
import './Spin.scss';

/** CloudMR‑styled wrapper around Ant Design’s `<Spin>` */
const CmrSpin: React.FC<SpinProps> = props => <Spin {...props} />;

export default CmrSpin;
