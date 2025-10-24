import { Box, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import SearchableDropdown from '../common/SearchableDropdown';

const TableFilters = ({ searchValue, onSearchChange }) => {
  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  return (
    <Box sx={{ 
      mb: 3, 
      display: 'flex', 
      gap: 2, 
      alignItems: 'center',
      flexWrap: 'wrap' 
    }}>
      <TextField
        placeholder="Search companies..."
        value={searchValue}
        onChange={handleSearchChange}
        size="small"
        sx={{ minWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default TableFilters;