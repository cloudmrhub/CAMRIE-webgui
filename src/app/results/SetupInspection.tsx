import React from "react";
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useAppSelector } from "../../features/hooks";
import {
  ENCODING_DIRECTION_OPTIONS,
  type EncodingDirectionId,
  type SequenceGeometryJson,
} from "../../common/utilities/sequenceGeometry";
import type { FovPlaneOrientation } from "../../common/utilities/fovBoundingBoxMesh";

type CamrieOptionsBlob = {
  sequences?: Array<{
    alias?: string;
    spin_factor?: number;
    file?: { options?: { filename?: string } };
    geometry?: SequenceGeometryJson;
  }>;
  bodymodel?: { options?: { filename?: string } };
  marie_inputs?: Record<string, unknown>;
  output?: {
    matlab?: boolean;
    SNR?: boolean;
    RSSreconstruction?: boolean;
  };
};

const ACCENT = "#1578A1";

const DIRECTION_FALLBACK_LABELS: Record<EncodingDirectionId, string> = {
  left: "Right - Left",
  right: "Left - Right",
  posterior: "Anterior - Posterior",
  anterior: "Posterior - Anterior",
  down: "Head - Feet",
  up: "Feet - Head",
};

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function capitalize(text: string): string {
  return text.length ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function directionLabel(
  orientation: FovPlaneOrientation | undefined,
  direction: EncodingDirectionId | undefined,
): string {
  if (!direction) return "—";
  if (orientation && ENCODING_DIRECTION_OPTIONS[orientation]) {
    const match = ENCODING_DIRECTION_OPTIONS[orientation].find(
      (opt) => opt.value === direction,
    );
    if (match) return match.label;
  }
  return DIRECTION_FALLBACK_LABELS[direction] ?? direction;
}

/**
 * `loadResult` stores UNZIP `headers.options` on `activeJob.setup.task`.
 * CAMRIE result zips put sequences/bodymodel/marie_inputs at that level;
 * submitted jobs may nest them under `task.options`. Normalize both.
 */
function getCamrieOptions(task: any): CamrieOptionsBlob | null {
  if (!task || typeof task !== "object") return null;
  if (Array.isArray(task.sequences)) return task as CamrieOptionsBlob;
  if (task.options && Array.isArray(task.options.sequences)) {
    return task.options as CamrieOptionsBlob;
  }
  return null;
}

function getOutputSettings(task: any, options: CamrieOptionsBlob | null) {
  return (
    options?.output ??
    task?.output ??
    (task?.options && !Array.isArray(task.options.sequences)
      ? task.options.output
      : undefined)
  );
}

const label = (text: string) => (
  <Box component="span" sx={{ color: ACCENT, fontWeight: 600 }}>
    {text}
  </Box>
);

const Item = ({ children }: { children: React.ReactNode }) => (
  <ListItem sx={{ py: 0.25, px: 0 }}>
    <ListItemIcon sx={{ minWidth: 28 }}>
      <ArrowRightIcon sx={{ color: ACCENT }} />
    </ListItemIcon>
    <ListItemText
      primary={<Typography sx={{ fontSize: 16 }}>{children}</Typography>}
    />
  </ListItem>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography
    sx={{
      mt: 3,
      mb: 0.75,
      pt: 1,
      fontWeight: 600,
      fontSize: "16px",
      color: ACCENT,
    }}
  >
    {children}
  </Typography>
);

export const SetupInspection = () => {
  const activeJob = useAppSelector((state) => state.result.activeJob);
  const task = activeJob?.setup?.task;
  const options = getCamrieOptions(task);
  const output = getOutputSettings(task, options);
  const sequences = options?.sequences ?? [];
  const marie = options?.marie_inputs ?? {};
  const bodymodelFilename = options?.bodymodel?.options?.filename;
  const jobAlias =
    activeJob?.alias ||
    task?.alias ||
    (typeof task?.options?.alias === "string" ? task.options.alias : undefined);

  if (!options) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          color: "rgba(0,0,0,0.4)",
        }}
      >
        No job settings found in this result
      </Box>
    );
  }

  return (
    <Box>
      <List sx={{ py: 0 }}>
        <Item>
          {label("Job Alias:")} {formatValue(jobAlias)}
        </Item>
        {output && (
          <>
            <Item>
              {label("MATLAB Output:")} {formatValue(output.matlab)}
            </Item>
            <Item>
              {label("SNR Output:")} {formatValue(output.SNR)}
            </Item>
            <Item>
              {label("RSS Reconstruction:")}{" "}
              {formatValue(output.RSSreconstruction)}
            </Item>
          </>
        )}

        <SectionTitle>Body Model</SectionTitle>
        <Item>
          {label("Body Model File:")} {formatValue(bodymodelFilename)}
        </Item>

        <SectionTitle>
          Pulse Sequences ({sequences.length})
        </SectionTitle>
        {sequences.length === 0 && (
          <Item>{label("Sequences:")} None</Item>
        )}
        {sequences.map((seq, index) => {
          const geometry = seq.geometry;
          const ui = geometry?.ui;
          const orientation = ui?.orientation;
          const matrix = geometry?.matrix;
          const fovMm = geometry?.fov_mm;
          const slice = geometry?.slice;
          const spinFactor = seq.spin_factor ?? ui?.spin_factor;
          const offset = ui?.slice_offset_mm ?? ui?.prescription_offset_mm;
          const zRot = ui?.angulation_z_deg ?? ui?.angulation_slice_deg;
          const resX =
            matrix?.[0] && fovMm?.[0] != null
              ? Number((fovMm[0] / matrix[0]).toFixed(4))
              : undefined;
          const resY =
            matrix?.[1] && fovMm?.[1] != null
              ? Number((fovMm[1] / matrix[1]).toFixed(4))
              : undefined;

          return (
            <Box key={`${seq.alias ?? "seq"}-${index}`} sx={{ mb: 1 }}>
              {index > 0 && <Divider sx={{ my: 1 }} />}
              <Item>
                {label(`Sequence ${index + 1}:`)}{" "}
                {formatValue(seq.alias || `Sequence ${index + 1}`)}
              </Item>
              <Item>
                {label("Sequence File:")}{" "}
                {formatValue(seq.file?.options?.filename)}
              </Item>
              <Item>
                {label("Spin Factor:")} {formatValue(spinFactor)}
              </Item>
              <Item>
                {label("Slice Orientation:")}{" "}
                {orientation ? capitalize(orientation) : "—"}
              </Item>
              <Item>
                {label("Phase Encoding Direction:")}{" "}
                {directionLabel(orientation, ui?.phase_encoding_direction)}
              </Item>
              <Item>
                {label("Frequency Encoding Direction:")}{" "}
                {directionLabel(orientation, ui?.frequency_encoding_direction)}
              </Item>
              <Item>
                {label("Phase FoV (mm) / Resolution (mm) / Pixels:")}{" "}
                {formatValue(fovMm?.[1])} / {formatValue(resY)} /{" "}
                {formatValue(matrix?.[1])}
              </Item>
              <Item>
                {label("Frequency FoV (mm) / Resolution (mm) / Pixels:")}{" "}
                {formatValue(fovMm?.[0])} / {formatValue(resX)} /{" "}
                {formatValue(matrix?.[0])}
              </Item>
              <Item>
                {label("Number of Slices:")} {formatValue(slice?.num_slices)}
              </Item>
              <Item>
                {label("Slice Thickness (mm):")}{" "}
                {formatValue(slice?.thickness_mm)}
              </Item>
              <Item>
                {label("Slice Gap (mm):")} {formatValue(slice?.gap_mm)}
              </Item>
              <Item>
                {label("Translation Offset X / Y / Z (mm):")}{" "}
                {formatValue(offset)}
              </Item>
              <Item>
                {label("Angulation LR / AP / Z (deg):")}{" "}
                {formatValue(ui?.angulation_lr_deg)} /{" "}
                {formatValue(ui?.angulation_ap_deg)} / {formatValue(zRot)}
              </Item>
              <Item>
                {label("Isocenter (mm):")} {formatValue(geometry?.isocenter_mm)}
              </Item>
            </Box>
          );
        })}
      </List>
    </Box>
  );
};
