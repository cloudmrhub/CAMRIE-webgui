import * as React from 'react';
import clsx from 'clsx';          // tiny helper for class merging (optional)
import './Label.scss';

export interface CmrLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const CmrLabel = React.forwardRef<HTMLLabelElement, CmrLabelProps>(
  ({ children, required = false, className, style, ...rest }, ref) => (
    <label
      ref={ref}
      className={clsx('cmr-label', className)}
      style={{ fontSize: 16, ...style }}
      {...rest}
    >
      {children}
      {required && <span className="asterik">*</span>}
    </label>
  )
);

CmrLabel.displayName = 'CmrLabel';
export default CmrLabel;
