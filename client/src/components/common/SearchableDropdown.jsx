import { useState } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  Box,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

const SearchableDropdown = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = 'Search...',
  width = 200,
  displayEmpty = true,
  emptyLabel = 'All'
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleClear = () => {
    setSearchText('');
    onChange('');
  };

  return (
    <FormControl sx={{ minWidth: width }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        displayEmpty={displayEmpty}
      >
        {displayEmpty && (
          <MenuItem value="">
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TextField
                size="small"
                placeholder={placeholder}
                value={searchText}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent Select from closing
                  setSearchText(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()} // Prevent Select from closing
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchText ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClear();
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Box>
          </MenuItem>
        )}
        {filteredOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SearchableDropdown;