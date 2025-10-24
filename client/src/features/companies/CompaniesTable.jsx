import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCompanies,
  updateCompany,
  selectAllCompanies,
  selectCompaniesStatus,
  selectCompaniesError
} from './companiesSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const CompaniesTable = () => {
  const dispatch = useDispatch();
  const companies = useSelector(selectAllCompanies);
  const status = useSelector(selectCompaniesStatus);
  const error = useSelector(selectCompaniesError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCompanies());
    }
  }, [status, dispatch]);

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
  );
};

export default CompaniesTable;