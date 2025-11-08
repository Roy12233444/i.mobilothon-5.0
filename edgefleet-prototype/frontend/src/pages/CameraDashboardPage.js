import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import CameraDashboard from '../components/CameraDashboard';

const CameraDashboardPage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Traffic Monitoring Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Monitor real-time traffic conditions from connected cameras and analyze traffic patterns.
        </Typography>
      </Box>
      
      <CameraDashboard />
    </Container>
  );
};

export default CameraDashboardPage;
