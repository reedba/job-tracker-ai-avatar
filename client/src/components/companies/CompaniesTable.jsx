import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { fetchCompanies, updateCompany } from '../../features/companies/companiesSlice';

const CompaniesTable = () => {
  const dispatch = useDispatch();
  const { items: companies, status, error } = useSelector((state) => state.companies);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCompanies());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        Error loading companies: {error}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="companies table">
        <TableHead>
          <TableRow>
            <TableCell>Favorite</TableCell>
            <TableCell>Company Name</TableCell>
            <TableCell>Website</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>
                <IconButton onClick={() => {
                  dispatch(updateCompany({
                    id: company.id,
                    updates: { favorited: !company.favorited }
                  }));
                }}>
                  {company.favorited ? <Star color="primary" /> : <StarBorder />}
                </IconButton>
              </TableCell>
              <TableCell component="th" scope="row">
                {company.name}
              </TableCell>
              <TableCell>
                {company.webpage ? (
                  <a
                    href={company.webpage}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {company.webpage}
                  </a>
                ) : (
                  'N/A'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CompaniesTable;