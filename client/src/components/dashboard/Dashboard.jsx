import { useState } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Tabs, 
  Tab,
  Paper
} from '@mui/material';
import Layout from '../layout/Layout';
import CompaniesTable from '../companies/CompaniesTable';
import ApplicationsTable from '../applications/ApplicationsTable';
import ContactsTable from '../contacts/ContactsTable';
import AddCompanyModal from '../companies/AddCompanyModal';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {getTabTitle()}
          </Typography>
        </Box>
        
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

        <TabPanel value={currentTab} index={0}>
          <CompaniesTable />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <ApplicationsTable />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <ContactsTable />
        </TabPanel>

        <AddCompanyModal
          open={isAddModalOpen}
          onClose={handleCloseAddModal}
        />
      </Container>
    </Layout>
  );
};

export default Dashboard;
