import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import CmrButton from '../button/Button';

interface CmrNameDialogProps {
  originalName: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  renamingCallback: (alias: string) => Promise<boolean>;
}

export default function CmrNameDialog({
  originalName,
  open,
  setOpen,
  renamingCallback,
}: CmrNameDialogProps) {
  const [text, setText]           = React.useState(originalName);
  const [helperText, setHelper]   = React.useState('');
  const [error, setError]         = React.useState(false);

  const close = () => setOpen(false);

  /* validate whenever originalName changes */
  React.useEffect(() => {
    validate(originalName);
  }, [originalName]);

  const validate = (val: string) => {
    // allow 1‑5 letter extensions (e.g. ".nii.gz" would fail; adapt if needed)
    const fileNameRegex = /^[a-zA-Z0-9_\-]+\.[a-zA-Z]{1,5}$/;
    const newExt = val.split('.').pop();
    const oldExt = originalName.includes('.') ? originalName.split('.').pop() : '?';

    if (!fileNameRegex.test(val)) {
      setError(true);
      setHelper(
        val.includes('.')
          ? 'Invalid file name, please check.'
          : 'Invalid file name, needs a valid extension.'
      );
    } else if (newExt !== oldExt) {
      setError(false);
      setHelper(`You are changing the extension from .${oldExt} to .${newExt}.`);
    } else {
      setError(false);
      setHelper('');
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    validate(e.target.value);
  };

  const confirm = async () => {
    if (await renamingCallback(text)) close();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>Rename the file {originalName} as:</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          variant="standard"
          value={text}
          inputProps={{ style: { fontSize: '16pt' } }}
          error={error}
          helperText={helperText}
          onFocus={e => e.target.select()}
          onChange={onInputChange}
        />
      </DialogContent>

      <DialogActions>
        <CmrButton variant="outlined" color="inherit" sx={{ color: '#333' }} onClick={close}>
          Cancel
        </CmrButton>
        <CmrButton variant="contained" color="primary" onClick={confirm} disabled={error}>
          Confirm
        </CmrButton>
      </DialogActions>
    </Dialog>
  );
}
