import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  color,
  variant = 'contained',
  ...props
}) => {
  return (
    <Button
      {...props}
      color={color}
      variant={variant}
      className={`custom-button ${className || ''}`}
    >
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', marginRight: '8px', ...iconStyle }}>
          {React.isValidElement(icon) ? icon : <FontAwesomeIcon icon={icon} />}
        </span>
      )}
      {text}
    </Button>
  );
};

export default CustomButton;
