import { Box, Container, Typography, Paper, Button, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AIAvatar = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 96, height: 96 }}>AI</Avatar>
          <Box>
            <Typography variant="h5">AI Avatar</Typography>
            <Typography variant="body2" color="text.secondary">
              This is a placeholder AI Avatar page. Integrate your avatar creation
              or profile UI here — image generation, upload, or selection.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            You can add controls here to let admins generate or pick an avatar for the assistant.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => alert('Generate avatar - placeholder')}>Generate Avatar</Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIAvatar;
