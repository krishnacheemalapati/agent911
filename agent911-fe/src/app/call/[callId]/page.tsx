"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTranscripts, transcribeCall } from '../../apiService';
import { Button, Typography, List, ListItem, Card, CardContent, Divider } from '@mui/material';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import CreatePatientButton from '../../CreatePatientButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function LiveTranscriptDisplay({ transcripts }: { transcripts: any[] }) {
  return (
    <Card sx={{ marginTop: 0, background: '#181818', color: '#fff', boxShadow: 3 }}>
      <CardContent>
        <Divider sx={{ mb: 0, background: '#444' }} />
        <List>
          {transcripts.map((t, idx) => (
            <ListItem key={idx} sx={{ display: 'block', mb: 1 }}>
              <Typography variant="body2" color="secondary" sx={{ fontWeight: 500 }}>
                {new Date(t.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', ml: 2 }}>
                {t.text}
              </Typography>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default function ConversationRoomPage({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = React.use(params);
  const [recording, setRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [report, setReport] = useState<any>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    getTranscripts(callId).then(setTranscripts);
    // Fetch Gemini report
    axios.get(`http://127.0.0.1:8000/api/calls/${callId}/report/`).then(res => {
      setReport(res.data.report || 'No report available.');
    }).catch(() => setReport('No report available.'));
  }, [callId]);

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
      try {
        const result = await transcribeCall(Number(callId), audioFile);
        console.log('Transcribe result:', result);
        if (result) {
          setTranscripts((prev) => [...prev, {
            timestamp: result.timestamp || new Date().toISOString(),
            text: result.text || result.transcript || '',
            is_final: result.is_final || true
          }]);
          // Refresh Gemini report after transcription
          axios.get(`http://127.0.0.1:8000/api/calls/${callId}/report/`).then(res => {
            setReport(res.data.report || 'No report available.');
          }).catch(() => setReport('No report available.'));
        }
      } catch (error) {
        console.error('Failed to transcribe:', error);
        alert('Failed to transcribe audio. Please try again.');
      }
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Call #{callId}</Typography>
      <Accordion defaultExpanded sx={{ background: '#222', color: '#fff', boxShadow: 4, mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#90caf9' }} />}>
          <Typography variant="h6">Gemini Report</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ mb: 2, background: '#444' }} />
          {report && typeof report === 'object' && !Array.isArray(report) && !report.error ? (
            <div>
              {Object.entries(report).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', ml: 2 }}>{String(value)}</Typography>
                </div>
              ))}
            </div>
          ) : typeof report === 'string' ? (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{report}</Typography>
          ) : (
            <Typography variant="body1" sx={{ color: '#f44336' }}>{report?.error || 'No report available.'}</Typography>
          )}
          {report?.raw && (
            <Typography variant="body2" sx={{ color: '#ff9800', mt: 2 }}>Raw Gemini Output:<br />{report.raw}</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded sx={{ background: '#181818', color: '#fff', boxShadow: 3, mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#90caf9' }} />}>
          <Typography variant="h6">Transcript</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <LiveTranscriptDisplay transcripts={transcripts} />
        </AccordionDetails>
      </Accordion>
      <Button
        variant="contained"
        color="primary"
        onClick={startRecording}
        disabled={recording}
        sx={{ margin: 1 }}
      >
        {transcripts.length === 0 ? 'Start Recording' : 'Continue Recording'}
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={stopRecording}
        disabled={!recording}
        sx={{ margin: 1 }}
      >
        Stop Recording
      </Button>
      <CreatePatientButton report={report} callId={callId} />
    </div>
  );
}
