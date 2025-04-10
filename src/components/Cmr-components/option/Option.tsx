import { Select } from 'antd';
import type { ReactNode } from 'react';
import './Option.scss';

const { Option } = Select;

export interface CmrOptionProps {
  title?: string;
  value: string | number;
  disabled?: boolean;
  children?: ReactNode;
}

const CmrOption: React.FC<CmrOptionProps> = ({
  title,
  value,
  disabled,
  children,
  ...rest
}) => (
  <Option title={title} value={value} disabled={disabled} {...rest}>
    {children}
  </Option>
);

export default CmrOption;
