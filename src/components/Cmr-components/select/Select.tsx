import { Select } from 'antd';
import type { SelectProps } from 'antd';
import type { ReactNode } from 'react';
import './Select.scss';

export interface CmrSelectProps<T extends string | number = string>
  extends Omit<SelectProps<T>, 'children' | 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled value (single or multiple) */
  value?: T | T[];
  /** Uncontrolled default */
  defaultValue?: T | T[];
  /** Change handler */
  onChange?: (value: T | T[]) => void;
  /** Option nodes */
  children?: ReactNode;
}

const CmrSelect = <T extends string | number = string>({
  children,
  defaultValue,
  value,
  ...rest
}: CmrSelectProps<T>) => (
  <Select<T>
    {...rest}
    defaultValue={Array.isArray(defaultValue) ? defaultValue[0] : defaultValue}
    value={Array.isArray(value) ? value[0] : value}
  >
    {children}
  </Select>
);

export default CmrSelect;
