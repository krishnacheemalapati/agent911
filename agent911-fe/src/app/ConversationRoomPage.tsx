"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTranscripts, transcribeCall } from './apiService';
import { Button, Typography, List, ListItem } from '@mui/material';

function LiveTranscriptDisplay({ transcripts }: { transcripts: any[] }) {
  return (
    <List>
      {transcripts.map((t, idx) => (
        <ListItem key={idx}>
          <span>{t.timestamp}: </span>
          <span>{t.text}</span>
          {t.is_final && <strong> (final)</strong>}
        </ListItem>
      ))}
    </List>
  );
}

  const { callId } = React.use(useParams());
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const result = await transcribeCall(Number(callId), audioFile);
      setTranscript(result.text || '');
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  return (
    <div style={{ padding: 32 }}>
      <Typography variant="h5">Call #{callId}</Typography>
      <Button variant="contained" color="primary" onClick={startRecording} disabled={recording} style={{ margin: 8 }}>
        Start Recording
      </Button>
      <Button variant="contained" color="secondary" onClick={stopRecording} disabled={!recording} style={{ margin: 8 }}>
        Stop Recording
      </Button>
      <Typography variant="body1" style={{ marginTop: 16 }}>
        {transcript ? transcript : 'No transcript yet.'}
      </Typography>
    </div>
  );
}
