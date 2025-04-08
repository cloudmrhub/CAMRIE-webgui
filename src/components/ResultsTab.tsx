// src/components/ResultsTab.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
} from '@mui/material';

interface ResultEntry {
  id: string;
  name: string;
  status: string;
  downloadUrl?: string;
}

export default function ResultsTab() {
  const [results, setResults] = useState<ResultEntry[]>([]);

  const fetchResults = async () => {
    // Placeholder: Replace with actual fetch
    setResults([
      { id: 'r1', name: 'job_output_1.zip', status: 'done', downloadUrl: '#' },
      { id: 'r2', name: 'job_output_2.zip', status: 'running' },
    ]);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Job Results
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.status}</TableCell>
                <TableCell align="right">
                  {entry.status === 'done' ? (
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        href={entry.downloadUrl}
                        target="_blank"
                      >
                        Download
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
