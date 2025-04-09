import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setFieldId, setSequenceId } from '../store/jobSlice';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  TextField,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
const fieldOptions = [
  {
    id: 'cloudMR_overlap-ismrm25.zip',
    name: 'overlap',
    b0: '3T',
    channels: 16,
    coil: 'overlap',
    date: '2024-09-01',
    description: 'Overlap 16 Channels Coil for 3T MRI scanner with Duke Phantom',
    image:"https://erosmontin.s3.us-east-1.amazonaws.com/overlap.jpg"
  },
  {
    id: 'cloudMR_birdcagecoil-ismrm25.zip',
    name: 'birdcage',
    b0: '3T',
    channels: 1,
    coil: 'birdcage',
    date: '2024-09-01',
    description: 'Birdcage single Coil for 3T MRI scanner with Duke Phantom',
    image:"https://erosmontin.s3.us-east-1.amazonaws.com/bird.jpg"
  },
  {
    id: 'cloudMR_triangularcoil-ismrm25.zip',
    name: 'triangular',
    b0: '3T',
    channels: 1,
    coil: 'triangular',
    date: '2024-09-01',
    description: 'Triangular single Coil for 3T MRI scanner with Duke Phantom',
    image:"https://erosmontin.s3.us-east-1.amazonaws.com/tri.jpg"
  },
];

const sequenceOptions = [
  {
    id: 'ISMRM25-miniflash-01.seq',
    name: 'Miniflash',
    description: 'ISMRM25',
    tr: '20 ms',
    te: '8 ms',
    ta: '3 sec',
    type: 'pulseq'
  },
  {
    id: 'ISMRM25-t1w.seq',
    name: 'T1-weighted',
    description: 'ISMRM25',
    tr: '600 ms',
    te: '10 ms',
    ta: '4 sec',
    type: 'pulseq'
  },
  {
    id: 'ISMRM25-t2w.seq',
    name: 'T2-weighted',
    description: 'ISMRM25',
    tr: '4000 ms',
    te: '80 ms',
    ta: '6 sec',
    type: 'pulseq'
  },
  {
    id: 'ISMRM25-pdw.seq',
    name: 'PD-weighted',
    description: 'ISMRM25',
    tr: '4000 ms',
    te: '10 ms',
    ta: '5 sec',
    type: 'pulseq'
  },
];
const API_ENDPOINT = import.meta.env.VITE_PIPELINE_ENDPOINT;

export default function JobForm() {
  const dispatch = useDispatch();
  const { fieldId, sequenceId } = useSelector((state: RootState) => state.job);
  const token = useSelector((state: RootState) => state.auth?.token ?? '');
  const [status, setStatus] = useState('');
  const [sliceLocation, setSliceLocation] = useState(20);
  const [alias, setAlias] = useState('');

  const selectedField = fieldOptions.find((f) => f.id === fieldId);
  const selectedSequence = sequenceOptions.find((s) => s.id === sequenceId);

  const handleSubmit = async () => {
    if (!fieldId || !sequenceId || !alias || sliceLocation <= 0) {
      setStatus('❌ Please fill all fields correctly.');
      return;
    }

    const payload = {
      application: 'CAMRIE',
      alias: alias,
      task: {
        version: '1.0',
        field_id: fieldId,
        sequence_id: sequenceId,
        image_plane: {
          slice_thickness: 0.5,
          spacing_between_slices: 2,
          image_position_patient: [1, 0, 0, 0, 1, 0],
          slice_location: sliceLocation,
          pixel_spacing: [0.5, 0.5],
        },
        reconstructor: {
          task: {
            version: 'v0',
            acquisition: 2,
            type: 'SNR',
            id: 2,
            name: 'PMR',
            options: {
              NR: 20,
              reconstructor: {
                type: 'recon',
                name: 'GRAPPA',
                id: 4,
                options: {
                  noise: {},
                  signal: {},
                },
              },
            },
          },
        },
      },
    };

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      setStatus('✅ Job successfully queued!');
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Setup Parameters
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Alias"
              fullWidth
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Slice Location"
              type="number"
              fullWidth
              value={sliceLocation}
              onChange={(e) =>
                setSliceLocation(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="field-id-label">Field ID</InputLabel>
              <Select
                labelId="field-id-label"
                value={fieldId ?? ''}
                label="Field ID"
                onChange={(e) => dispatch(setFieldId(e.target.value))}
              >
                {fieldOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedField && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Field Details
                </Typography>
                <Typography>ID: {selectedField.id}</Typography>
                <Typography>B0: {selectedField.b0}</Typography>
                <Typography>Channels: {selectedField.channels}</Typography>
                <Typography>Coil: {selectedField.coil}</Typography>
                <Typography>Date: {selectedField.date}</Typography>
                <Typography>Description: {selectedField.description}</Typography>
                <img
                  src={selectedField.image}
                  alt={selectedField.name}
                  style={{ maxWidth: '100%', height: 'auto', marginTop: '10px' }}
                />
              </Paper>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="sequence-id-label">Sequence ID</InputLabel>
              <Select
                labelId="sequence-id-label"
                value={sequenceId ?? ''}
                label="Sequence ID"
                onChange={(e) => dispatch(setSequenceId(e.target.value))}
              >
                {sequenceOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedSequence && (
  <Grid item xs={12}>
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Sequence Details
      </Typography>
      <Typography>ID: {selectedSequence.id}</Typography>
      <Typography>Description: {selectedSequence.description}</Typography>
      <Typography>TR: {selectedSequence.tr}</Typography>
      <Typography>TE: {selectedSequence.te}</Typography>
      <Typography>TA: {selectedSequence.ta}</Typography>
    </Paper>
  </Grid>
)}
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Queue Job
            </Button>
          </Grid>

          {status && (
            <Grid item xs={12}>
              <Typography
                variant="body2"
                color={status.startsWith('✅') ? 'green' : 'error'}
              >
                {status}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}