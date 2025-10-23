import { Typography, Container, Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Layout from '../layout/Layout';
import CompaniesTable from '../companies/CompaniesTable';

const Dashboard = () => {
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
          >
            Add Company
          </Button>
        </Box>
        <CompaniesTable />
      </Container>
    </Layout>
  );
};

export default Dashboard;
