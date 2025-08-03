"use client";

import React, { useEffect, useState } from 'react';
import { createCall, listCalls } from './apiService';
import { Button, Typography, Grid, Card, CardContent, CardActionArea, Box, Avatar } from '@mui/material';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import HistoryIcon from '@mui/icons-material/History';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [calls, setCalls] = useState([]);
  const router = useRouter();

  useEffect(() => {
    listCalls().then(setCalls);
  }, []);

  // Calculate average call duration (in seconds)
  const completedCalls = calls.filter((call: any) => call.end_time && call.start_time);
  const avgDurationSec = completedCalls.length > 0
    ? Math.round(
        completedCalls.reduce((sum: number, call: any) => {
          const start = new Date(call.start_time).getTime();
          const end = new Date(call.end_time).getTime();
          return sum + (end - start) / 1000;
        }, 0) / completedCalls.length
      )
    : 0;

  // Format seconds to mm:ss
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    const call = await createCall();
    router.push(`/call/${call.id}`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
          <LocalPhoneIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>Agentic 911 Operator Dashboard</Typography>
          <Typography variant="subtitle1" sx={{ color: 'white' }}>Welcome, Operator!</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleStartCall} startIcon={<LocalPhoneIcon />} sx={{ mr: 2 }}>
          Start New Call
        </Button>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body1" sx={{ color: 'white' }}>
            <strong>Total Calls:</strong> {calls.length}
          </Typography>
        </Box>
        <Box sx={{ ml: 4 }}>
          <Typography variant="body1" sx={{ color: 'white' }}>
            <strong>Avg. Call Duration:</strong> {completedCalls.length > 0 ? formatDuration(avgDurationSec) : 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}><HistoryIcon sx={{ mr: 1 }} />Recent Calls</Typography>
      <Grid container spacing={2}>
        {calls.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary">No calls yet. Start a new call to begin.</Typography>
          </Grid>
        ) : (
          calls.map((call: any) => (
            <Grid item xs={12} sm={6} md={4} key={call.id}>
              <Card elevation={2}>
                <CardActionArea onClick={() => router.push(`/call/${call.id}`)}>
                  <CardContent>
                    <Typography variant="subtitle2" color="primary">Call #{call.id}</Typography>
                    <Typography variant="body2" color="text.secondary">Started: {call.start_time}</Typography>
                    {call.end_time && (
                      <Typography variant="body2" color="text.secondary">
                        Duration: {formatDuration(Math.round((new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000))}
                      </Typography>
                    )}
                    {/* Add more call details here if available */}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
