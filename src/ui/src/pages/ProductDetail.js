import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Card, CardContent, TablePagination
} from '@mui/material';

function ProductDetail() {
  const { productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    if (product) {
      fetchProductReviews();
    }
  }, [product, page, rowsPerPage]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        console.error('Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews?page=${page + 1}&limit=${rowsPerPage}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotalReviews(data.total || 0);
      } else {
        console.error('Failed to fetch product reviews');
      }
    } catch (error) {
      console.error('Error fetching product reviews:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Product not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {product.name}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Product Details</Typography>
              <Typography variant="body1">
                <strong>Source:</strong> {product.source || 'Unknown'}
              </Typography>
              <Typography variant="body1">
                <strong>URL:</strong> {product.url || 'Unknown'}
              </Typography>
              <Typography variant="body1">
                <strong>Added:</strong> {new Date(product.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Reviews ({totalReviews})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reviewer</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <TableRow key={review._id}>
                      <TableCell>{review.reviewer_name || 'Anonymous'}</TableCell>
                      <TableCell>{review.rating || 'N/A'}</TableCell>
                      <TableCell>{review.comment || 'No comment'}</TableCell>
                      <TableCell>
                        {review.review_date ? new Date(review.review_date).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No reviews found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalReviews}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProductDetail;