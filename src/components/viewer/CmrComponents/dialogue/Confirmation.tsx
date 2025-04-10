import * as React from 'react';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button'; // Import the simple MUI Button

export default function Confirmation({ 
    name,
    message,
    cancelText = 'Cancel',
    color,
    open,
    setOpen,
    confirmCallback = () => {},
    confirmText = 'Confirm',
    cancellable = false,
    cancelCallback = () => {},
    width
  }: { 
    name: string | undefined; 
    cancelText?: string; 
    message: string | undefined;
    color?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning" | undefined; 
    open: boolean; 
    setOpen: (open: boolean) => void; 
    confirmCallback?: () => void;
    cancellable?: boolean; 
    cancelCallback?: () => void; 
    width?: number; 
    confirmText?: string 
  }) {

    const handleClose = () => {
        setOpen(false);
    };

    const handleConfirm = () => {
        confirmCallback();
        handleClose();
    };

    const handleCancel = () => {
        cancelCallback();
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{name ? name : 'Confirmation'}</DialogTitle>
            <DialogContent sx={{ width: width }}>
                <DialogContentText alignContent={'center'}>
                    {message}
                </DialogContentText>
                <DialogActions className={'mt-4'}>
                    {cancellable && (
                        <Button 
                          variant="outlined" 
                          color="inherit" 
                          onClick={handleCancel}
                          style={{ color: '#333', textTransform: 'none' }} // simple style override
                        >
                          {cancelText}
                        </Button>
                    )}
                    <Button 
                      variant="contained" 
                      color={color} 
                      onClick={handleConfirm}
                      style={{ textTransform: 'none' }}  // simple style override
                    >
                      {confirmText}
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
}
