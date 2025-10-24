import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCompanies,
  updateCompany,
  selectAllCompanies,
  selectCompaniesStatus,
  selectCompaniesError
} from './companiesSlice';
import AddCompanyModal from '../../components/companies/AddCompanyModal';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Box,
  Button
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const CompaniesTable = () => {
  const dispatch = useDispatch();
  const companies = useSelector(selectAllCompanies);
  const status = useSelector(selectCompaniesStatus);
  const error = useSelector(selectCompaniesError);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // Only fetch if we don't have any companies and haven't started fetching yet
    if (status === 'idle' && companies.length === 0) {
      dispatch(fetchCompanies());
    }
  }, [status, companies.length, dispatch]);

  const handleToggleFavorite = (company) => {
    dispatch(updateCompany({
      id: company.id,
      updates: { is_favorite: !company.is_favorite }
    }));
  };

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Company
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Favorite</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.name}</TableCell>
                <TableCell>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  )}
                </TableCell>
                <TableCell>{company.location}</TableCell>
                <TableCell>{company.notes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleToggleFavorite(company)}>
                    {company.is_favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AddCompanyModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default CompaniesTable;