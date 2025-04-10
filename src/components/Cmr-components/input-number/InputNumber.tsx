import * as React from 'react';
import { InputNumber, InputNumberProps } from 'antd';
import './InputNumber.scss';

export interface CmrInputNumberProps
  extends Omit<InputNumberProps<number>, 'size'> {
  size?: 'small' | 'middle' | 'large';
}

const CmrInputNumber = React.forwardRef<
  HTMLInputElement,
  CmrInputNumberProps
>((props, ref) => {
  const { children, ...rest } = props;

  return (
    <InputNumber<number> ref={ref} {...rest}>
      {children}
    </InputNumber>
  );
});

CmrInputNumber.displayName = 'CmrInputNumber';
export default CmrInputNumber;
