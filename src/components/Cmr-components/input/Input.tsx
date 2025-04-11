import * as React from 'react';
import { Input, InputProps } from 'antd';
import './Input.scss';

// Optional: if you're using InputRef elsewhere and it's causing conflict, redefine it here
type InputRef = HTMLInputElement;

export interface CmrInputProps
  extends Omit<InputProps, 'size' | 'prefix' | 'type'> {
  size?: 'small' | 'middle' | 'large';
  type?: React.HTMLInputTypeAttribute;
  prefix?: React.ReactNode;
}

const CmrInput = React.forwardRef<InputRef, CmrInputProps>(
  (
    {
      defaultValue,
      id,
      maxLength,
      size,
      value,
      type,
      prefix,
      bordered,
      onChange,
      onPressEnter,
      ...rest
    },
    ref
  ) => (
    <Input
    ref={ref as unknown as React.Ref<any>}
      defaultValue={defaultValue}
      id={id}
      maxLength={maxLength}
      size={size}
      value={value}
      type={type}
      prefix={prefix}
      bordered={bordered}
      onChange={onChange}
      onPressEnter={onPressEnter}
      {...rest}
    />
  )
);

CmrInput.displayName = 'CmrInput';
export default CmrInput;
