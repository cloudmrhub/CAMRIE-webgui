import * as React from 'react';
import { Input, InputProps } from 'antd';
import './Input.scss';

export interface CmrInputProps
  extends Omit<InputProps, 'size' | 'prefix' | 'type'> {
  size?: 'small' | 'middle' | 'large';
  type?: React.HTMLInputTypeAttribute;
  prefix?: React.ReactNode; // ✅ Explicitly added to avoid TS2339
}

const CmrInput = React.forwardRef<HTMLInputElement, CmrInputProps>(
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
      ref={ref}
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
