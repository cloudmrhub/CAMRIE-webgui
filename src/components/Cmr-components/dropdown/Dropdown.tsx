
import * as React from 'react';
import { useState, useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import './DropDown.scss';

const { Option } = Select;

type BasicOption<T extends string | number> = {
  label: React.ReactNode;
  value: T;
};

export interface CmrDropDownProps<T extends string | number = string>
  extends Omit<SelectProps<T>, 'options'> {
  options: T[] | BasicOption<T>[];
  isOptionsObj?: boolean;
}

function CmrDropDown<T extends string | number = string>({
  options,
  isOptionsObj = false,
  ...rest
}: CmrDropDownProps<T>) {
  const [open, setOpen] = useState(false);

  const caret = useMemo(
    () => (
      <>
        {/* down */}
        <svg
          style={{ display: open ? 'none' : 'block' }}
          width="6"
          height="3"
          viewBox="0 0 6 3"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.79875 0H0.20125C0.03336 0 -0.06039 0.147179 0.04359 0.247656L2.84234 2.94215C2.92245 3.01928 3.0767 3.01928 3.15766 2.94215L5.95641 0.247656C6.06039 0.147179 5.96664 0 5.79875 0Z"
            fill="#999"
          />
        </svg>
        {/* up */}
        <svg
          style={{ display: open ? 'block' : 'none' }}
          width="6"
          height="3"
          viewBox="0 0 6 3"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.79875 3H0.20125C0.03336 3 -0.06039 2.85282 0.04359 2.75234L2.84234 0.0578451C2.92245 -0.0192819 3.0767 -0.0192819 3.15766 0.0578451L5.95641 2.75234C6.06039 2.85282 5.96664 3 5.79875 3Z"
            fill="#999"
          />
        </svg>
      </>
    ),
    [open]
  );

  return (
    <div className="select-box">
      <Select<T>
        {...rest}
        onDropdownVisibleChange={v => setOpen(v)}
        suffixIcon={caret}
        dropdownAlign={{
          offset: [0, 0],
          overflow: { adjustY: 0 },
        }}
      >
        {isOptionsObj
          ? (options as BasicOption<T>[]).map(({ label, value }) => (
              <Option key={String(value)} value={value}>
                {label}
              </Option>
            ))
          : (options as T[]).map(value => (
              <Option key={String(value)} value={value}>
                {value}
              </Option>
            ))}
      </Select>
    </div>
  );
}

export default CmrDropDown;