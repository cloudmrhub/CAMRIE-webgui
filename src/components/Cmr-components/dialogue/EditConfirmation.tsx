import * as React from 'react';
import {
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
} from '@mui/material';
import CmrButton from '../button/Button';

export interface EditConfirmationProps {
  name?: string;
  defaultText?: string;
  message?: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  open: boolean;
  setOpen: (open: boolean) => void;
  confirmCallback?: (text: string) => void;
  cancellable?: boolean;
  cancelCallback?: (text: string) => void;
  suffix?: string;
}

export default function EditConfirmation({
  name = 'Confirmation',
  message,
  defaultText = '',
  color = 'primary',
  open,
  setOpen,
  confirmCallback = () => {},
  cancellable = false,
  cancelCallback = () => {},
  suffix = '',
}: EditConfirmationProps) {
  const [text, setText] = React.useState(defaultText);

  // reset local state whenever the dialog opens or the default changes
  React.useEffect(() => {
    if (open) setText(defaultText);
  }, [open, defaultText]);

  const close = () => setOpen(false);

  const confirm = () => {
    confirmCallback(text + suffix);
    close();
  };

  const cancel = () => {
    cancelCallback(text + suffix);
    close();
  };

  return (
    <Dialog maxWidth="xs" fullWidth open={open} onClose={close}>
      <DialogTitle>{name}</DialogTitle>

      <DialogContent>
        {message && (
          <DialogContentText sx={{ mb: 2 }} align="center">
            {message}
          </DialogContentText>
        )}

        <TextField
          fullWidth
          variant="standard"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          InputProps={{
            endAdornment: suffix && (
              <InputAdornment position="end" sx={{ whiteSpace: 'nowrap' }}>
                {suffix}
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {cancellable && (
          <CmrButton variant="outlined" color="inherit" onClick={cancel}>
            Cancel
          </CmrButton>
        )}
        <CmrButton
          variant="contained"
          color={color}
          onClick={confirm}
          disabled={text + suffix === defaultText + suffix}
        >
          Confirm
        </CmrButton>
      </DialogActions>
    </Dialog>
  );
}
