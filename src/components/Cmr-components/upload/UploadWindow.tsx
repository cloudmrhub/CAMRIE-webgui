import {
    Alert,
    AlertColor,
    Box,
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    TextField,
    Typography
  } from '@mui/material';
  import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
  import CmrLabel from '../label/Label';
  import './Upload.scss';
  
  interface UploadWindowProps {
    upload: (file: File, alias: string, database: string) => Promise<number>;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    fileExtension?: string;
    template?: {
      showFileName?: boolean;
      showDatabase?: boolean;
      showFileSize?: boolean;
    };
  }
  
  export default function UploadWindow({
    upload,
    open,
    setOpen,
    fileExtension,
    template = { showFileName: true, showDatabase: true, showFileSize: true },
  }: UploadWindowProps) {
    const [fileOriginalName, setFileOriginalName] = useState('');
    const [fileAlias, setFileAlias] = useState('');
    const [fileSize, setFileSize] = useState('0 MB');
    const [warningText, setWarningText] = useState('');
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoStyle, setInfoStyle] = useState<AlertColor>('info');
    const [uploadedFiles, setUploaded] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadText, setUploadText] = useState('Upload');
    const [uploadBoxWarning, setUploadBoxWarning] = useState<string>();
  
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
  
    const getExtension = (name: string) => name.split('.').pop()?.toLowerCase();
  
    const showInfo = (msg: string, severity: AlertColor = 'info', timeout = 2500) => {
      setWarningText(msg);
      setInfoStyle(severity);
      setInfoOpen(true);
      setTimeout(() => setInfoOpen(false), timeout);
    };
  
    const loadFile = (file: File) => {
      setUploaded([file]);
      setFileOriginalName(file.name);
      setFileAlias(file.name);
      const size = file.size;
      const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), 8);
      const value = (size / 1024 ** exponent).toFixed(3);
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      setFileSize(`${value} ${units[exponent]}`);
    };
  
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return showInfo('No file selected', 'warning');
      if (files.length > 1) return showInfo('Only one file allowed', 'warning');
      const file = files[0];
      if (fileExtension && `.${getExtension(file.name)}` !== fileExtension) {
        return showInfo(`Only ${fileExtension} files accepted`, 'warning');
      }
      loadFile(file);
    };
  
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setUploadBoxWarning(undefined);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      if (files.length > 1) return showInfo('Only one file allowed', 'warning');
      const file = files[0];
      if (fileExtension && `.${getExtension(file.name)}` !== fileExtension) {
        return showInfo(`Only ${fileExtension} files accepted`, 'warning');
      }
      loadFile(file);
    };
  
    const handleUpload = async () => {
      if (uploadedFiles.length === 0) return showInfo('Select a file to upload', 'error');
      if (!fileAlias.trim()) return showInfo('File name cannot be empty', 'error');
  
      setOpen(false);
      setUploading(true);
      setUploadText('Uploading');
  
      try {
        const response = await upload(uploadedFiles[0], fileAlias, 's3');
        setUploading(false);
        setUploadText('Upload');
  
        switch (response) {
          case 200:
            showInfo('Upload successful', 'success', 1000);
            break;
          case 400:
            showInfo('Upload cancelled', 'warning');
            setOpen(true);
            break;
          case 413:
            showInfo('File size limit exceeded', 'error');
            setOpen(true);
            break;
          case 500:
            showInfo('Server error', 'error');
            setOpen(true);
            break;
          default:
            showInfo('Unknown status', 'warning');
            setOpen(true);
        }
      } catch (err: any) {
        setUploading(false);
        setUploadText('Upload');
        showInfo(`Upload failed: ${err.message}`, 'error');
      }
    };
  
    const handleAliasChange = (e: ChangeEvent<HTMLInputElement>) => setFileAlias(e.target.value);
  
    const triggerFileDialog = () => {
      inputRef.current?.click();
    };
  
    useEffect(() => {
      const dropZone = dropZoneRef.current;
      if (!dropZone) return;
  
      const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files?.length && fileExtension && `.${getExtension(files[0].name)}` !== fileExtension) {
          setUploadBoxWarning(`Only ${fileExtension} files allowed`);
        }
      };
  
      const onDragLeave = () => {
        setUploadBoxWarning(undefined);
      };
  
      dropZone.addEventListener('dragover', onDragOver);
      dropZone.addEventListener('dragleave', onDragLeave);
      dropZone.addEventListener('drop', handleDrop);
  
      return () => {
        dropZone.removeEventListener('dragover', onDragOver);
        dropZone.removeEventListener('dragleave', onDragLeave);
        dropZone.removeEventListener('drop', handleDrop);
      };
    }, [fileExtension]);
  
    return (
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>File Upload</DialogTitle>
        <DialogContent>
          <DialogContentText />
  
          <DialogContent dividers>
            <Box
              ref={dropZoneRef}
              width={500}
              height={250}
              sx={{
                border: '2px dashed',
                borderRadius: 1,
                borderColor: uploadBoxWarning ? '#BA3C3C' : 'lightGray',
              }}
              onClick={triggerFileDialog}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                textAlign="center"
              >
                <Typography variant="body1">
                  Drag & Drop or Click to Upload Your File Here <sup>*</sup>
                </Typography>
                <Typography variant="body2" fontSize="0.8rem" fontStyle="italic">
                  * Make sure the file is anonymized before uploading. You are solely responsible for this.
                </Typography>
              </Box>
            </Box>
  
            <input
              ref={inputRef}
              id="file-window"
              type="file"
              accept={fileExtension ?? '*'}
              hidden
              onChange={handleFileSelect}
            />
  
            <Box sx={{ '& .MuiTextField-root': { m: 2, width: '25ch', mb: 0 } }}>
              {template.showFileName && (
                <TextField
                  label="File Alias"
                  required
                  variant="standard"
                  value={fileAlias}
                  onChange={handleAliasChange}
                />
              )}
  
              {fileOriginalName && (
                <CmrLabel style={{ marginLeft: 2, fontSize: '9pt', color: '#267833' }}>
                  {fileOriginalName}
                </CmrLabel>
              )}
  
              {template.showDatabase && (
                <TextField
                  select
                  label="Database"
                  defaultValue="s3"
                  helperText="Storage location"
                  variant="standard"
                >
                  <MenuItem value="s3">S3</MenuItem>
                </TextField>
              )}
  
              {template.showFileSize && (
                <TextField
                  label="File Size"
                  variant="standard"
                  value={fileSize}
                  InputProps={{ readOnly: true }}
                />
              )}
  
              <Collapse in={infoOpen}>
                <Alert severity={infoStyle} sx={{ m: 1 }}>
                  {warningText}
                </Alert>
              </Collapse>
            </Box>
          </DialogContent>
  
          <DialogActions>
            <Button disabled={uploading} onClick={() => setOpen(false)} sx={{ color: '#333' }}>
              Cancel
            </Button>
            <Button disabled={uploading} variant="contained" onClick={handleUpload}>
              {uploadText}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    );
  }
  