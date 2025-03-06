import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Jobs</Typography>
      <Grid container spacing={3}>
        {jobs.map(job => (
          <Grid item xs={12} md={6} lg={4} key={job._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{job.sourceName}</Typography>
                <Typography color="textSecondary" gutterBottom>{job.sourceUrl}</Typography>
                <Button 
                  component={Link} 
                  to={`/jobs/${job._id}`}
                  variant="contained"
                  color="primary"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default JobsPage;