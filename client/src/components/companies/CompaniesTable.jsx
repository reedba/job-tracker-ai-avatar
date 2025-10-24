import { useEffect, useState } from 'react';
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
  Button,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { Star, StarBorder, FilterList } from '@mui/icons-material';
import { fetchCompanies, updateCompany, optimisticUpdateCompany } from '../../features/companies/companiesSlice';
import AddApplicationModal from '../applications/AddApplicationModal';
import AddCompanyModal from './AddCompanyModal';
import TableFilters from './TableFilters';

const countBadgeStyle = {
  display: 'inline-block',
  minWidth: '24px',
  padding: '4px 8px',
  borderRadius: '12px',
  backgroundColor: 'primary.main',
  color: 'primary.contrastText'
};

const CompaniesTable = () => {
  const dispatch = useDispatch();
  const companiesState = useSelector((state) => state.companies);
  const { items: companies, status, error } = companiesState;

  // State declarations
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    applicationStatus: {
      hasApplications: true,
      noApplications: true
    },
    favoriteStatus: {
      favorited: true,
      notFavorited: true
    }
  });

  // Popover states
  const [applicationAnchorEl, setApplicationAnchorEl] = useState(null);
  const [favoriteAnchorEl, setFavoriteAnchorEl] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleFilterClick = (event, filterType) => {
    if (filterType === 'application') {
      setApplicationAnchorEl(event.currentTarget);
    } else if (filterType === 'favorite') {
      setFavoriteAnchorEl(event.currentTarget);
    }
  };

  const handleFilterClose = (filterType) => {
    if (filterType === 'application') {
      setApplicationAnchorEl(null);
    } else if (filterType === 'favorite') {
      setFavoriteAnchorEl(null);
    }
  };

  const handleCheckboxChange = (filterType, key) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [key]: !prev[filterType][key]
      }
    }));
  };

  const handleOpenApplicationModal = (company) => {
    setSelectedCompany(company);
    setIsApplicationModalOpen(true);
  };

  const handleCloseApplicationModal = () => {
    setSelectedCompany(null);
    setIsApplicationModalOpen(false);
  };

  const handleOpenAddCompanyModal = () => {
    setIsAddCompanyModalOpen(true);
  };

  const handleCloseAddCompanyModal = () => {
    setIsAddCompanyModalOpen(false);
  };

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

  const safeCompanies = Array.isArray(companies) ? companies : [];
  const filteredCompanies = safeCompanies.filter(company => {
    if (filters.search && !company.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    const hasApplications = (company.applications_count || 0) > 0;
    if (!filters.applicationStatus.hasApplications && hasApplications) return false;
    if (!filters.applicationStatus.noApplications && !hasApplications) return false;

    if (!filters.favoriteStatus.favorited && company.favorited) return false;
    if (!filters.favoriteStatus.notFavorited && !company.favorited) return false;

    return true;
  });

  return (
    <Box>
      {/* Header section with search and add button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ flexGrow: 1 }}>
          <TableFilters 
            searchValue={filters.search}
            onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenAddCompanyModal}
        >
          Add Company
        </Button>
      </Box>

      {/* Table section */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="companies table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  Favorite
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'favorite')}>
                    <FilterList fontSize="small" />
                  </IconButton>
                  <Popover
                    open={Boolean(favoriteAnchorEl)}
                    anchorEl={favoriteAnchorEl}
                    onClose={() => handleFilterClose('favorite')}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.favoriteStatus.favorited}
                              onChange={() => handleCheckboxChange('favoriteStatus', 'favorited')}
                              size="small"
                            />
                          }
                          label="Favorited"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.favoriteStatus.notFavorited}
                              onChange={() => handleCheckboxChange('favoriteStatus', 'notFavorited')}
                              size="small"
                            />
                          }
                          label="Not Favorited"
                        />
                      </FormGroup>
                    </Box>
                  </Popover>
                </Stack>
              </TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Website</TableCell>
              <TableCell align="center">
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  Applications
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'application')}>
                    <FilterList fontSize="small" />
                  </IconButton>
                  <Popover
                    open={Boolean(applicationAnchorEl)}
                    anchorEl={applicationAnchorEl}
                    onClose={() => handleFilterClose('application')}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.applicationStatus.hasApplications}
                              onChange={() => handleCheckboxChange('applicationStatus', 'hasApplications')}
                              size="small"
                            />
                          }
                          label="Has Applications"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.applicationStatus.noApplications}
                              onChange={() => handleCheckboxChange('applicationStatus', 'noApplications')}
                              size="small"
                            />
                          }
                          label="No Applications"
                        />
                      </FormGroup>
                    </Box>
                  </Popover>
                </Stack>
              </TableCell>
              <TableCell align="center">Last Application</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow
                key={company.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <IconButton
                    onClick={() => {
                      const newValue = !company.favorited;
                      dispatch(optimisticUpdateCompany({
                        id: company.id,
                        updates: { favorited: newValue }
                      }));
                      dispatch(updateCompany({
                        id: company.id,
                        updates: { favorited: newValue }
                      }));
                    }}
                  >
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
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    sx={countBadgeStyle}
                  >
                    {typeof company.applications_count === 'number' ? company.applications_count : 0}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {company.last_application_date ? (
                    <Typography variant="body2">
                      {new Date(company.last_application_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        timeZone: 'UTC'
                      })}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No applications
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenApplicationModal(company)}
                  >
                    Add Application
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      {selectedCompany && (
        <AddApplicationModal
          open={isApplicationModalOpen}
          onClose={handleCloseApplicationModal}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
        />
      )}
      <AddCompanyModal
        open={isAddCompanyModalOpen}
        onClose={handleCloseAddCompanyModal}
      />
    </Box>
  );
};

export default CompaniesTable;