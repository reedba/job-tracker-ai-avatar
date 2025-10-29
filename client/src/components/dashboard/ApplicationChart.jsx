import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography, Box, Grid, LinearProgress } from '@mui/material';
import { selectAllApplications } from '../../features/applications/applicationsSlice';
import { selectSetting } from '../../features/settings/settingsSlice';

const ApplicationChart = () => {
  const applications = useSelector(selectAllApplications);
  const setting = useSelector(selectSetting);

  // Get current month applications
  const currentMonthData = useMemo(() => {
    if (!applications || applications.length === 0) {
      return { count: 0, percentage: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthApps = applications.filter(app => {
      if (!app.date_submitted) return false;
      const appDate = new Date(app.date_submitted);
      return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
    });

    const count = currentMonthApps.length;
    const goal = setting?.application_monthly_goal || 0;
    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;

    return { count, goal, percentage };
  }, [applications, setting]);

  // Process applications data for the chart
  const chartData = useMemo(() => {
    if (!applications || applications.length === 0) {
      return {
        dates: [],
        counts: [],
        labels: []
      };
    }

    // Group applications by month
    const monthlyData = {};
    
    applications.forEach(app => {
      if (app.date_submitted) {
        const date = new Date(app.date_submitted);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            label: monthLabel,
            count: 0,
            date: date
          };
        }
        monthlyData[monthKey].count++;
      }
    });

    // Sort by date and prepare data for chart
    const sortedData = Object.values(monthlyData).sort((a, b) => a.date - b.date);
    
    return {
      dates: sortedData.map((_, index) => index),
      counts: sortedData.map(d => d.count),
      labels: sortedData.map(d => d.label)
    };
  }, [applications]);

  // Calculate total applications
  const totalApplications = applications?.length || 0;
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Application Tracking Dashboard
      </Typography>

      {/* Current Month Progress */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {currentMonth}
              </Typography>
              <Typography variant="h4" gutterBottom>
                {currentMonthData.count} {currentMonthData.goal > 0 ? `/ ${currentMonthData.goal}` : ''} Applications
              </Typography>
              {currentMonthData.goal > 0 && (
                <>
                  <LinearProgress 
                    variant="determinate" 
                    value={currentMonthData.percentage} 
                    sx={{ height: 8, borderRadius: 1, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentMonthData.percentage.toFixed(0)}% of monthly goal
                  </Typography>
                </>
              )}
              {currentMonthData.goal === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Set a monthly goal in settings to track progress
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Applications
              </Typography>
              <Typography variant="h4">
                {totalApplications}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Chart */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Applications Over Time
        </Typography>
        {chartData.labels.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No application data available yet. Start tracking your applications!
            </Typography>
          </Box>
        ) : (
          <LineChart
            xAxis={[{ 
              data: chartData.dates,
              scaleType: 'point',
              valueFormatter: (value) => chartData.labels[value] || ''
            }]}
            series={[
              {
                data: chartData.counts,
                label: 'Applications Submitted',
                color: '#1976d2',
                showMark: true,
              },
            ]}
            height={300}
            margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
            sx={{
              width: '100%',
              '.MuiLineElement-root': {
                strokeWidth: 2,
              },
              '.MuiMarkElement-root': {
                scale: '0.8',
                fill: '#fff',
                strokeWidth: 2,
              },
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default ApplicationChart;
