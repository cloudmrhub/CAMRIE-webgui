import {  useState } from 'react';
import { Button, Box, Select, MenuItem, Dialog,
         DialogTitle, DialogContent } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

import CMRUpload, { CMRUploadProps } from '../upload/Upload';
import './SelectUpload.scss';

/* ---------------- types ---------------- */

export interface UploadedFile {
  id: number;
  fileName: string;
  link: string;
  md5?: string;
  size: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  database: string;
  location: string;
}

export interface CMRSelectUploadProps extends CMRUploadProps {
  fileSelection: UploadedFile[];
  onSelected: (file?: UploadedFile) => void;
  chosenFile?: string;
  buttonText?: string;
  fileExtension?: string;
}

/* ---------------- component ---------------- */

const CMRSelectUpload: React.FC<CMRSelectUploadProps> = ({
  fileSelection,
  onSelected,
  chosenFile,
  buttonText = 'Choose',
  fileExtension,
  style,
  ...uploadProps
}) => {
  const [open, setOpen]       = useState(false);
  const [index, setIndex]     = useState<number>(-1);
  const [uploading, setUp]    = useState(false);
  const [progress, setProg]   = useState(0);

  const handleChange = (e: SelectChangeEvent<number>) =>
    setIndex(Number(e.target.value));

  const handleSet = () => {
    onSelected(fileSelection[index]);
    setOpen(false);
  };

  return (
    <>
      {/* main button */}
      {uploading ? (
        <Button variant="contained" color="primary" disabled sx={{ textTransform: 'none', ...style }}>
          Uploading&nbsp;{progress}%
        </Button>
      ) : (
        <Button
          variant={chosenFile ? 'outlined' : 'contained'}
          color="info"
          onClick={() => {
            setIndex(-1);
            setOpen(true);
          }}
          sx={{ mr: 2, textTransform: 'none', ...style }}
        >
          {chosenFile ?? buttonText}
        </Button>
      )}

      {/* dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Select or Upload</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Select
            fullWidth
            value={index}
            onChange={handleChange}
            disabled={uploading}
          >
            <MenuItem value={-1}>
              {fileSelection.length === 0 ? (
                <em>No stored files</em>
              ) : (
                <em>Select a stored file</em>
              )}
            </MenuItem>

            {fileSelection.map((f, i) => (
              <MenuItem key={f.id ?? i} value={i}>
                {f.fileName}
              </MenuItem>
            ))}
          </Select>

          <Box sx={{ display: 'flex', mt: 3, gap: 1 }}>
            {index !== -1 && !uploading && (
              <Button fullWidth variant="contained" color="success" onClick={handleSet}>
                OK
              </Button>
            )}

            {index === -1 && (
              <CMRUpload
                {...uploadProps}
                fullWidth
                color="info"
                fileExtension={fileExtension}
                uploadStarted={() => {
                  setUp(true);
                  onSelected(undefined);
                }}
                uploadProgressed={p => {
                  setProg(p);
                  setOpen(false);
                }}
                uploadEnded={() => setUp(false)}
                onUploaded={(res, file) => {
                  setIndex(fileSelection.length); // point to the freshly uploaded file
                  uploadProps.onUploaded?.(res, file);
                  setOpen(false);
                }}
              />
            )}

            <Button fullWidth variant="outlined" color="inherit" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CMRSelectUpload;
