import { Radio } from 'antd';
import type { RadioProps } from 'antd';
import type { ReactNode } from 'react';
import './Radio.scss';

export interface CmrRadioProps<T = any>
  extends Omit<RadioProps, 'children' | 'value'> {
  /** Radio value that will be submitted */
  value?: T;
  /** Label */
  children?: ReactNode;
}

const CmrRadio = <T,>({
  children,
  ...rest
}: CmrRadioProps<T>) => (
  <Radio {...rest}>
    {children}
  </Radio>
);

export default CmrRadio;
