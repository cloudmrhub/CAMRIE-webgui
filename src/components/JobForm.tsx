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
  Grid,
  Paper,
  Divider,
} from '@mui/material';

const fieldOptions = [
  { id: 'cloudMR_birdcagecoil-ismrm25.zip', name: 'Birdcage Coil' },
  { id: 'cloudMR_arraycoil-v2.zip', name: 'Array Coil' },
];

const sequenceOptions = [
  { id: 'ISMRM25-miniflash-01.seq', name: 'Miniflash' },
  { id: 'ISMRM25-radial.seq', name: 'Radial' },
];

const API_ENDPOINT = import.meta.env.VITE_PIPELINE_ENDPOINT;

export default function JobForm() {
  const dispatch = useDispatch();
  const { fieldId, sequenceId } = useSelector((state: RootState) => state.job);
  const token = useSelector((state: RootState) => state.auth?.token ?? '');
  const [status, setStatus] = useState('');
  const [sliceLocation, setSliceLocation] = useState(20);
  const [alias, setAlias] = useState('');

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
              onChange={(e) => setSliceLocation(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Field ID</InputLabel>
              <Select
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

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sequence ID</InputLabel>
              <Select
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
              <Typography variant="body2" color={status.startsWith('✅') ? 'green' : 'error'}>
                {status}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
