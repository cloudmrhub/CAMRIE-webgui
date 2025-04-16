import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#f8f9fa',
        paddingBottom: '25px',
        paddingTop: '30px',
        marginTop: 'auto',
        textAlign: 'center',
        fontSize: '14px !important',
        color: '#6c757d',
      }}
    >
      <Container>
        <Typography>
          &copy; 2025 Copyright: Center for Biomedical Imaging. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
