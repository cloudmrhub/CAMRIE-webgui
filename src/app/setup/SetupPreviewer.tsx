import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { CmrButton } from "cloudmr-ux";
import { ChangeEvent, useState } from "react";

type SetupPreviewProps = {
  previewContent: string;
  alias: string;
  setAlias: (event: ChangeEvent) => void;
  queue: (jobAlias: string) => void | Promise<void>;
  edit: () => void;
  handleClose: () => void;
  editText?: string;
  queueText?: string;
  developer: boolean;
};

/** Job-name characters disallowed by the backend / pipeline naming rules. */
const INVALID_JOB_ALIAS_REGEX = /[ ,:%><]/;

export const SetupPreview = ({
  previewContent,
  queue,
  edit,
  handleClose,
  alias,
  setAlias,
  editText = "Keep Editing",
  queueText = "Queue Job",
  developer,
}: SetupPreviewProps) => {
  const [jobName, setJobName] = useState("");
  const [aliasError, setAliasError] = useState(false);
  const [aliasErrorText, setAliasErrorText] = useState("");
  const [queueBusy, setQueueBusy] = useState(false);

  const handleAliasChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAliasError(false);
    setAliasErrorText("");

    const v = event.target.value;
    if (INVALID_JOB_ALIAS_REGEX.test(v)) {
      setAliasError(true);
      setAliasErrorText("Job name contains spaces or invalid characters ( , : % > < )");
    }

    setJobName(v);
    setAlias(event);
  };

  const handleQueueClick = async () => {
    const raw = jobName || String(alias ?? "");
    const candidate = raw.trim();

    if (!candidate) {
      setAliasError(true);
      setAliasErrorText("Job name is required.");
      return;
    }

    if (INVALID_JOB_ALIAS_REGEX.test(raw)) {
      setAliasError(true);
      setAliasErrorText("Job name contains spaces or invalid characters ( , : % > < )");
      return;
    }

    setQueueBusy(true);
    try {
      await queue(candidate);
      handleClose();
    } finally {
      setQueueBusy(false);
    }
  };

  const rawName = jobName || String(alias ?? "");
  const candidate = rawName.trim();
  const queueDisabled =
    queueBusy || !candidate || INVALID_JOB_ALIAS_REGEX.test(rawName);

  return (
    <Dialog open={true} onClose={handleClose} fullWidth={true}>
      <DialogTitle sx={{ ml: 2, mt: 2, mr: 2, p: 1 }}>Setup Preview</DialogTitle>
      <DialogContent sx={{ m: 2, mt: 0, mb: 1, p: 1 }} dividers>
        {developer && (
          <TextField
            multiline
            label="The CAMRIE JSON that will be submitted:"
            fullWidth
            maxRows={15}
            style={{
              overflowY: "auto",
              padding: "10pt",
            }}
            variant="standard"
            value={previewContent}
            InputProps={{
              disableUnderline: true,
            }}
          />
        )}
        <TextField
          fullWidth
          required
          label="Set Job Name:"
          placeholder={alias}
          value={jobName}
          variant="standard"
          onChange={handleAliasChange}
          error={aliasError}
          helperText={aliasError ? aliasErrorText : ""}
        />
      </DialogContent>

      <DialogActions sx={{ pt: 0, pl: 3, pr: 3 }}>
        <CmrButton
          fullWidth
          variant="outlined"
          onClick={() => {
            edit();
            handleClose();
          }}
        >
          {editText}
        </CmrButton>

        <CmrButton
          variant="contained"
          fullWidth
          disabled={queueDisabled}
          onClick={handleQueueClick}
        >
          {queueBusy ? "Queuing…" : queueText}
        </CmrButton>
      </DialogActions>
    </Dialog>
  );
};
