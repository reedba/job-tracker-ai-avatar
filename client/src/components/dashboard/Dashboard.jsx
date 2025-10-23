import { Typography, Container } from '@mui/material';
import Layout from '../layout/Layout';

const Dashboard = () => {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        {/* Add your dashboard content here */}
      </Container>
    </Layout>
  );
};

export default Dashboard;
