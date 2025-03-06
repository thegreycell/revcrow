import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { HomeIcon, JobIcon, ProductIcon } from './Icon';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            <HomeIcon /> RevCrow
          </Link>
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/jobs"
            startIcon={<JobIcon />}
          >
            Jobs
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/products"
            startIcon={<ProductIcon />}
          >
            Products
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;