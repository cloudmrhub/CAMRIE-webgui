import React from 'react';
import { Button, ButtonProps } from '@mui/material';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './CustomButton.css';

interface CustomButtonProps extends ButtonProps {
  icon?: any;
  text: string;
  className?: string;
  iconStyle?: React.CSSProperties;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  icon,
  text,
  className,
  iconStyle,
  ...props
}) => {
  return (
    <Button
      {...props}
      className={`custom-button ${className || ''}`}
    >
      {/* {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '12px', ...iconStyle }} />} */}
      {text}
    </Button>
  );
};

export default CustomButton;
