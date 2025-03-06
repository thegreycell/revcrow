import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Card, CardContent
} from '@mui/material';

function JobDetail() {
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData);
        
        // Fetch tasks for this job
        if (jobData.tasks && jobData.tasks.length > 0) {
          setTasks(jobData.tasks);
        }
      } else {
        console.error('Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Job not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Job Details
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Job ID
              </Typography>
              <Typography variant="h5" component="div">
                {job._id}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Status
              </Typography>
              <Typography variant="h5" component="div">
                {job.status || 'Pending'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Source
              </Typography>
              <Typography variant="h5" component="div">
                {job.sourceName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {job.sourceUrl}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Tasks
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Total Reviews</TableCell>
              <TableCell>Fetched Reviews</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <TableRow key={index}>
                  <TableCell>{task.url}</TableCell>
                  <TableCell>{task.status || 'Pending'}</TableCell>
                  <TableCell>{task.totalReviews || 'N/A'}</TableCell>
                  <TableCell>{task.fetchedReviews || 0}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No tasks found for this job</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default JobDetail;