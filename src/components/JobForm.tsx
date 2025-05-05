import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setFieldId, setSequenceId } from '../store/jobSlice';
import { Card, CardContent } from '@mui/material';

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
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

const fieldOptions = [
  {
    id: 'cloudMR_overlap-ismrm25.zip',
    name: '16-Ch 3T Head Surface Coil',
    b0: '3T',
    channels: 16,
    coil: '16-Ch 3T Head Surface Coil',
    resolution: '2 mm isotropic',
    emSimulator: 'MARIE_version_Hybrid_VSIE',
    numOfTissues: '22',
    numOfElements: '1',
    objectName: 'Duke_2mm',
    frequency: '2.1714514044179997E+9',
    description: 'Overlap 16 Channels Coil for 3T MRI scanner with Duke Phantom',
    image: "https://erosmontin.s3.us-east-1.amazonaws.com/overlap.jpg"
  },
  {
    id: 'cloudMR_birdcagecoil-ismrm25.zip',
    name: '3T Head Birdcage Coil',
    b0: '3T',
    channels: 1,
    coil: '3T Head Birdcage Coil',
    resolution: '2 mm isotropic',
    emSimulator: 'MARIE_version_Hybrid_VSIE',
    numOfTissues: '22',
    numOfElements: '1',
    objectName: 'Duke_2mm',
    frequency: '2.1714514044179997E+9',
    description: 'Birdcage single Coil for 3T MRI scanner with Duke Phantom',
    image: "https://erosmontin.s3.us-east-1.amazonaws.com/bird.jpg"
  },
  {
    id: 'cloudMR_triangularcoil-ismrm25.zip',
    name: '8-Ch 7T Head Triangular Coilr',
    b0: '7T',
    channels: 1,
    coil: '8-Ch 7T Head Triangular Coilr',
    resolution: '2 mm isotropic',
    emSimulator: 'MARIE_version_Hybrid_VSIE',
    numOfTissues: '23',
    numOfElements: '1',
    objectName: 'Duke_2mm',
    frequency: '2.34176131849E+9',
    description: 'Triangular single Coil for 3T MRI scanner with Duke Phantom',
    image: "https://erosmontin.s3.us-east-1.amazonaws.com/tri.jpg"
  },
];

const sequenceOptions = [
  {
    id: 'PD-Weighted_Spin_Echo.mtrk',
    name: 'PD Weighted Spin Echo',
    description: 'ISMRM25',
    tr: '4000ms',
    te: '10ms',
    fa: [90, 180],
    type: 'mtrk'
  },
  {
    id: 'PD-Weighted_Spin_Echo.seq',
    name: 'PD Weighted Spin Echo',
    description: 'ISMRM25',
    tr: '4000ms',
    te: '10ms',
    fa: [90, 180],
    type: 'pulseq'
  },
  {
    id: 'T1-Weighted_Spin_Echo.mtrk',
    name: 'T1 Weighted Spin Echo',
    description: 'ISMRM25',
    tr: '600ms',
    te: '10ms',
    fa: [90, 180],
    type: 'mtrk'
  },
  {
    id: 'T1-Weighted_Spin_Echo.seq',
    name: 'T1 Weighted Spin Echo',
    description: 'ISMRM25',
    tr: '600ms',
    te: '10ms',
    fa: [90, 180],
    type: 'pulseq'
  },
  {
    id: 'T1-Weighted_Spoiled_GRE.mtrk',
    name: 'T1 Weighted Spoiled GRE',
    description: 'ISMRM25',
    tr: '40ms',
    te: '10ms',
    fa: [15],
    type: 'mtrk'
  },
  {
    id: 'T1-Weighted_Spoiled_GRE.seq',
    name: 'T1 Weighted Spoiled GRE',
    description: 'ISMRM25',
    tr: '40ms',
    te: '10ms',
    fa: [15],
    type: 'pulseq'
  },
  {
    id: 'T2-Weighted_Spin_Echo.mtrk',
    name: 'T2 Weighted Spin Echo',
    description: 'ISMRM25',
    tr: '4000ms',
    te: '80ms',
    fa: [90, 180],
    type: 'mtrk'
  },
  {
    id: 'T2-Weighted_Spin_Echo.seq',
    name: 'T2 Weighted Spin Echo',
    description: 'ISMRM25',
    tr: '4000ms',
    te: '80ms',
    fa: [90, 180],
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
    <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      <Box display="flex" alignItems="center" mb={1}>
        <KeyboardDoubleArrowRightIcon sx={{ color: '#580f8b', fontSize: 20, mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#580f8b', fontSize: 18 }}>
          Setup Parameters
        </Typography>
      </Box>
      <Paper elevation={0} sx={{
        p: 4, border: '1px solid #ccc',
      }}>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
            <TextField
              label="Job Alias"
              fullWidth
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={5}>
            <TextField
              label="Slice Number"
              type="number"
              fullWidth
              value={sliceLocation}
              onChange={(e) =>
                setSliceLocation(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </Grid>

          <Grid item xs={12} sm={7}>
            <FormControl fullWidth>
              <InputLabel id="field-id-label">Select Model</InputLabel>
              <Select
                labelId="field-id-label"
                value={fieldId ?? ''}
                label="Select Model"
                onChange={(e) => dispatch(setFieldId(e.target.value))}
              >
                {fieldOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedField && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="stretch">
                    {/* First Column */}
                    <Grid item xs={12} sm={5}>
                      <Box textAlign="left" height="100%">
                        <Typography><strong>Object Name:</strong>&nbsp;{selectedField.objectName}</Typography>
                        <Typography><strong>B0</strong>&nbsp;=&nbsp;{selectedField.b0}</Typography>
                        <Typography><strong>Frequency:</strong>&nbsp;{selectedField.frequency}</Typography>
                        <Typography><strong>Resolution:</strong>&nbsp;{selectedField.resolution}</Typography>
                        <Typography><strong>Number of Tissues:</strong>&nbsp;{selectedField.numOfTissues}</Typography>
                      </Box>
                    </Grid>

                    {/* Vertical Divider */}
                    <Grid item xs={12} sm={1}>
                      <Divider orientation="vertical" sx={{ height: '100%', mx: 'auto' }} />
                    </Grid>

                    {/* Second Column */}
                    <Grid item xs={12} sm={6}>
                      <Box textAlign="left" height="100%">
                        <Typography><strong>Coil Name:</strong>&nbsp;{selectedField.coil}</Typography>
                        <Typography><strong>Number of Elements:</strong>&nbsp;{selectedField.numOfElements}</Typography>
                        <Typography><strong>EM&nbsp;Simulator:</strong>&nbsp;{selectedField.emSimulator}</Typography>
                      </Box>
                    </Grid>
                  </Grid>


                  <Box mt={2}>
                    <img
                      src={selectedField.image}
                      alt={selectedField.name}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id="sequence-id-label">Select Sequence</InputLabel>
              <Select
                labelId="sequence-id-label"
                value={sequenceId ?? ''}
                label="Select Sequence"
                onChange={(e) => dispatch(setSequenceId(e.target.value))}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 30 * 5 + 8, // 4 items at 37px height + padding
                    },
                  },
                }}
              >
                {sequenceOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedSequence && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Box textAlign="left" height="100%">
                    <Typography><strong>ID:</strong>&nbsp;{selectedSequence.id}</Typography>
                    <Typography><strong>Description:</strong>&nbsp;{selectedSequence.description}</Typography>
                    <Typography><strong>TR:</strong>&nbsp;{selectedSequence.tr}</Typography>
                    <Typography><strong>TE:</strong>&nbsp;{selectedSequence.te}</Typography>
                    <Typography><strong>FA:</strong>&nbsp;{selectedSequence.fa}</Typography>
                    <Typography><strong>ACC:</strong>&nbsp;1x1</Typography>
                  </Box>
                </CardContent>
              </Card>
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