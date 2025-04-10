import { Radio } from 'antd';
import type { RadioGroupProps, RadioChangeEvent } from 'antd';
import type { ReactNode } from 'react';
import './RadioGroup.scss';

export interface CmrRadioGroupProps<T = any>
  extends Omit<RadioGroupProps, 'children' | 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled value */
  value?: T;
  /** Uncontrolled default */
  defaultValue?: T;
  /** Change handler */
  onChange?: (e: RadioChangeEvent) => void;
  /** Radio buttons */
  children?: ReactNode;
}

const CmrRadioGroup = <T,>({
  defaultValue,
  disabled,
  name,
  value,
  onChange,
  children,
  ...rest
}: CmrRadioGroupProps<T>) => (
  <Radio.Group
    defaultValue={defaultValue}
    disabled={disabled}
    name={name}
    value={value}
    onChange={onChange}
    {...rest}
  >
    {children}
  </Radio.Group>
);

export default CmrRadioGroup;
