import { Box, Toolbar } from '@mui/material';
import MainToolbar from './MainToolbar';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MainToolbar />
      {/* This empty Toolbar component creates space below the fixed AppBar */}
      <Toolbar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
