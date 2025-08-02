"use client";
import React, { useEffect, useState } from 'react';
import { createCall, listCalls } from './apiService';
import { Button, List, ListItem, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

  const [calls, setCalls] = useState([]);
  const router = useRouter();

  useEffect(() => {
    listCalls().then(setCalls);
  }, []);

  const handleStartCall = async () => {
    const call = await createCall();
    router.push(`/call/${call.id}`);
  };

  return (
    <div style={{ padding: 32 }}>
      <Typography variant="h4">Agentic 911 Dashboard</Typography>
      <Button variant="contained" color="primary" onClick={handleStartCall} style={{ margin: 16 }}>
        Start New Call
      </Button>
      <Typography variant="h6">Past Calls</Typography>
      <List>
        {calls.map((call: any) => (
          <ListItem key={call.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/call/${call.id}`)}>
            Call #{call.id} - {call.start_time}
          </ListItem>
        ))}
      </List>
    </div>
  );
}
