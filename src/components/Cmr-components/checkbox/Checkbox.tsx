import React, { ChangeEvent, ReactNode, CSSProperties } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import './Checkbox.scss';

interface CmrCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
}

const CmrCheckbox = ({
  checked,
  defaultChecked,
  disabled,
  onChange,
  children,
  className,
  style,
  autoFocus,
}: CmrCheckboxProps) => {
  return (
    <FormControlLabel
      disabled={disabled}
      className={className}
      style={style}
      control={
        <Checkbox
          style={style}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          autoFocus={autoFocus}
        />
      }
      label={
        <span className="cmr-label" style={{ paddingRight: 0, paddingLeft: 0, color: 'var(--bs-card-color)' }}>
          {children}
        </span>
      }
      labelPlacement="start"
    />
  );
};

export default CmrCheckbox;
