import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress, Box 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?page=${page + 1}&limit=${rowsPerPage}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
        setTotalProducts(data.totalProducts || 0);
      } else {
        console.error('Failed to fetch products:', data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell>Total Reviews</TableCell>
                  <TableCell>Last Synced</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow 
                      key={product._id} 
                      onClick={() => handleRowClick(product._id)}
                      sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' } }}
                    >
                      <TableCell>{product.url}</TableCell>
                      <TableCell>{product.totalReviews || 'N/A'}</TableCell>
                      <TableCell>{product.lastSynced ? new Date(product.lastSynced).toLocaleString() : 'Never'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No products found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalProducts}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </>
      )}
    </Container>
  );
}

export default ProductsPage;
