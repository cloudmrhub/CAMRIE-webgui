import * as React from 'react';
import {
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';

interface DeletionDialogProps {
  name?: string;
  deletionCallback: () => void;
  open?: boolean;               // optional – defaults to true
  onClose?: () => void;         // bubble up close if parent cares
}

export default function DeletionDialog({
  name = '',
  deletionCallback,
  open: openProp = true,
  onClose,
}: DeletionDialogProps) {
  const [open, setOpen]   = React.useState(openProp);
  const [text, setText]   = React.useState('');

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  const confirm = () => {
    deletionCallback();
    close();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setText(e.target.value);

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Confirmation</DialogTitle>

      <DialogContent>
        <DialogContentText>
          To delete the files, please type your full name below and confirm.
        </DialogContentText>

        <TextField
          autoFocus
          fullWidth
          variant="standard"
          placeholder={name}
          inputProps={{ style: { fontSize: '16pt' } }}
          onChange={handleTextChange}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={close} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={confirm}
          color="error"
          disabled={text !== name}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
