import { useState } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Tabs, 
  Tab,
  Paper,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import Layout from '../layout/Layout';
import CompaniesTable from '../companies/CompaniesTable';
import ApplicationsTable from '../applications/ApplicationsTable';
import ContactsTable from '../contacts/ContactsTable';
import AddCompanyModal from '../companies/AddCompanyModal';
import ApplicationChart from './ApplicationChart';
import ChatWidget from '../chat/ChatWidget';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      style={{ display: value === index ? 'block' : 'none' }}
      {...other}
    >
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    </div>
  );
};

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Clear search when switching tabs
    setSearchValue('');
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const getTabTitle = () => {
    switch(currentTab) {
      case 0:
        return 'Companies';
      case 1:
        return 'Applications';
      case 2:
        return 'Contacts';
      default:
        return '';
    }
  };

  const getSearchPlaceholder = () => {
    switch(currentTab) {
      case 0:
        return 'Search companies...';
      case 1:
        return 'Search applications...';
      case 2:
        return 'Search contacts...';
      default:
        return 'Search...';
    }
  };

  return (
    <Layout>
      <Container maxWidth={false} sx={{ px: 3 }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Application Chart */}
          <ApplicationChart />
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Companies" />
              <Tab label="Applications" />
              <Tab label="Contacts" />
            </Tabs>
          </Paper>

        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder={getSearchPlaceholder()}
            value={searchValue}
            onChange={handleSearchChange}
            size="small"
            fullWidth
            sx={{ maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TabPanel value={currentTab} index={0}>
          <CompaniesTable searchFilter={searchValue} />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <ApplicationsTable searchFilter={searchValue} />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <ContactsTable searchFilter={searchValue} />
        </TabPanel>

        <AddCompanyModal
          open={isAddModalOpen}
          onClose={handleCloseAddModal}
        />

        {/* Chat Widget */}
        <ChatWidget />
        </Box>
      </Container>
    </Layout>
  );
};

export default Dashboard;
