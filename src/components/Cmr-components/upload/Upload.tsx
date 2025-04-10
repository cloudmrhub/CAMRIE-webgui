import { Fragment, useState } from 'react';
import { Box, Button, SxProps, Theme } from '@mui/material';
import UploadWindow from './UploadWindow';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import './Upload.scss';

export interface LambdaFile {
  filename: string;
  filetype: string;
  filesize: string;
  filemd5: string;
  file: File;
}

export interface CMRUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  maxCount: number;
  retains?: boolean;
  changeNameAfterUpload?: boolean;
  onRemove?: (removedFile: File) => void;
  beforeUpload?: (file: File) => Promise<boolean>;
  createPayload?: (
    file: File,
    fileAlias: string,
    fileDatabase: string
  ) => Promise<{ destination: string; lambdaFile: LambdaFile; file: File; config: AxiosRequestConfig } | undefined>;
  onUploadProgressUpdate?: (loaded: number, total: number) => void | undefined;
  onUploaded: (res: AxiosResponse, file: File) => Promise<void> | void;
  sx?: SxProps<Theme>;
  fileExtension?: string;
  uploadStarted?: () => void;
  uploadEnded?: () => void;
  uploadFailed?: () => void;
  uploadProgressed?: (progress: number) => void;
  uploadHandler?: (
    file: File,
    fileAlias: string,
    fileDatabase: string,
    onProgress?: (progress: number) => void,
    onUploaded?: (res: AxiosResponse, file: File) => void
  ) => Promise<number>;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  reusable?: boolean;
  uploadButtonName?: string;
  preprocess?: (file: File) => Promise<File | undefined | number>;
}

const CmrUpload = (props: CMRUploadProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | undefined>(undefined);

  const upload = async (
    file: File,
    fileAlias: string,
    fileDatabase: string
  ): Promise<number> => {
    setUploading(true);
    props.uploadStarted?.();

    const onProgress = (fraction: number) => {
      const percentage = +(fraction * 99).toFixed(2);
      props.uploadProgressed?.(percentage);
      setProgress(percentage);
    };

    if (props.beforeUpload && !(await props.beforeUpload(file))) {
      props.uploadEnded?.();
      setUploading(false);
      return 200;
    }

    if (props.preprocess) {
      const result = await props.preprocess(file);
      if (result === undefined) return failUpload();
      if (typeof result === 'number') {
        setUploading(false);
        return result;
      }
      file = result;
    }

    let status = 0;

    if (props.uploadHandler) {
      status = await props.uploadHandler(file, fileAlias, fileDatabase, onProgress, props.onUploaded);
      setUploadedFile(props.reusable ? undefined : file.name);
    } else if (props.createPayload) {
      const payload = await props.createPayload(file, fileAlias, fileDatabase);
      if (!payload) return failUpload();

      payload.config.onUploadProgress = evt => {
        if (!evt.total) return;
        onProgress(evt.loaded / evt.total);
      };

      const res = await axios.post(payload.destination, payload.lambdaFile, payload.config);
      status = res.status;

      if (status === 200) {
        await axios.put(res.data.upload_url, payload.file, {
          headers: { 'Content-Type': payload.file.type },
        });
        await props.onUploaded(res, payload.file);
        setUploadedFile(props.reusable ? undefined : payload.file.name);
      }
    } else {
      return failUpload();
    }

    props.uploadEnded?.();
    setUploading(false);
    setProgress(0);
    return status;
  };

  const failUpload = () => {
    setUploading(false);
    setProgress(0);
    props.uploadFailed?.();
    return 0;
  };

  return (
    <Fragment>
      {uploading ? (
        <Button
          fullWidth={props.fullWidth}
          style={props.style}
          variant="contained"
          sx={{ overflowWrap: 'inherit' }}
          color="primary"
          disabled
        >
          Uploading {progress}%
        </Button>
      ) : (
        <Button
          fullWidth={props.fullWidth}
          style={props.style}
          variant={uploadedFile ? 'outlined' : 'contained'}
          onClick={() => setOpen(true)}
          sx={props.sx}
        >
          {props.changeNameAfterUpload
            ? uploadedFile ?? props.uploadButtonName ?? 'Upload'
            : props.uploadButtonName ?? 'Upload'}
        </Button>
      )}

      <UploadWindow
        open={open}
        setOpen={setOpen}
        upload={upload}
        fileExtension={props.fileExtension}
        template={{ showFileName: true, showFileSize: true }}
      />
    </Fragment>
  );
};

CmrUpload.defaultProps = {
  changeNameAfterUpload: true,
};

export type { CMRUploadProps };
export default CmrUpload;
