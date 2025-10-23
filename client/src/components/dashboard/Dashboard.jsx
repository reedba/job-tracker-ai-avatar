import { useState } from 'react';
import { Typography, Container, Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Layout from '../layout/Layout';
import CompaniesTable from '../companies/CompaniesTable';
import AddCompanyModal from '../companies/AddCompanyModal';

const Dashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Companies
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
          >
            Add Company
          </Button>
        </Box>
        <CompaniesTable />
        <AddCompanyModal
          open={isAddModalOpen}
          onClose={handleCloseAddModal}
        />
      </Container>
    </Layout>
  );
};

export default Dashboard;
