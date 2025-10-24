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
  Button,
  Typography
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const CompanyRow = React.memo(({ company, onToggleFavorite }) => (
  <TableRow key={company.id}>
    <TableCell>{company.name}</TableCell>
    <TableCell>
      {company.webpage && (
        <a href={company.webpage} target="_blank" rel="noopener noreferrer">
          {company.webpage}
        </a>
      )}
    </TableCell>
    <TableCell>{company.location}</TableCell>
    <TableCell>{company.notes}</TableCell>
    <TableCell>
      <IconButton onClick={() => onToggleFavorite(company)}>
        {company.favorited ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
      </IconButton>
    </TableCell>
  </TableRow>
));

const CompaniesTable = () => {
  const dispatch = useDispatch();
  const companies = useSelector(selectAllCompanies);
  const status = useSelector(selectCompaniesStatus);
  const error = useSelector(selectCompaniesError);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // Only fetch if we haven't started fetching yet
    if (status === 'idle') {
      dispatch(fetchCompanies());
    }
  }, [status, dispatch]);

  const handleToggleFavorite = (company) => {
    dispatch(updateCompany({
      id: company.id,
      updates: { favorited: !company.favorited }
    }));
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          {status === 'failed' && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Box>
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
              <CompanyRow
                key={company.id}
                company={company}
                onToggleFavorite={handleToggleFavorite}
              />
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