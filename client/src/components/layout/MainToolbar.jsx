import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Settings as SettingsIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { logout, setUser } from '../../features/auth/authSlice';
import axios from '../../config/axios';
import SettingsModal from '../settings/SettingsModal';

const MainToolbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = Boolean(
    user && (
      user.is_admin === true ||
      user.is_admin === 'true' ||
      user.is_admin === 1 ||
      user.is_admin === '1'
    )
  );

  // Debug: show what the toolbar receives from Redux (temporary)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('MainToolbar debug - user:', user, 'isAdmin:', isAdmin);
  }

  // If we have a token but no user in the store (e.g., on page reload), fetch /api/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      axios
        .get('/api/me')
        .then((res) => {
          if (res.data && res.data.user) {
            dispatch(setUser(res.data.user));
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('Failed to fetch current user:', err?.response?.data || err.message);
        });
    }
  }, [user, dispatch]);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate('/login');
  };

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  const handleSettingsModalClose = () => {
    setIsSettingsModalOpen(false);
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-mobile-menu';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(mobileMoreAnchorEl)}
      onClose={() => setMobileMoreAnchorEl(null)}
    >
      {isAdmin && (
        <MenuItem
          onClick={() => {
            setMobileMoreAnchorEl(null);
            navigate('/avatar');
          }}
        >
          AI Avatar
        </MenuItem>
      )}
    </Menu>
  );

  return (
    <AppBar position="fixed">
      <Toolbar>
        {isAdmin && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-controls={mobileMenuId}
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Hire Buddy AI
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && (
            <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.first_name} {user.last_name}
            </Typography>
          )}
          
          <IconButton
            size="large"
            aria-label="settings"
            onClick={handleSettingsClick}
            color="inherit"
          >
            <SettingsIcon />
          </IconButton>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls={menuId}
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
      {renderMenu}
  {renderMobileMenu}
      
      <SettingsModal
        open={isSettingsModalOpen}
        onClose={handleSettingsModalClose}
      />
    </AppBar>
  );
};

export default MainToolbar;
