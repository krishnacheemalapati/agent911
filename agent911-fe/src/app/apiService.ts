import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

export const createCall = async (callerInfo = '') => {
  const res = await axios.post(`${API_BASE}/calls/`, { caller_info: callerInfo });
  return res.data;
};

export const listCalls = async () => {
  const res = await axios.get(`${API_BASE}/calls/`);
  return res.data;
};

export const getTranscripts = async (callId: number) => {
  const res = await axios.get(`${API_BASE}/calls/${callId}/transcripts/`);
  return res.data;
};

export const transcribeCall = async (callId: number, audioFile: File) => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    console.log('Sending transcribe request:', {
      url: `${API_BASE}/calls/${callId}/transcribe/`,
      fileType: audioFile.type,
      fileSize: audioFile.size
    });

    const res = await axios.post(`${API_BASE}/calls/${callId}/transcribe/`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      validateStatus: (status) => status < 500
    });

    if (res.status === 404) {
      throw new Error('Transcribe endpoint not found. Please check if the call ID exists and the endpoint is correct.');
    }

    if (!res.data) {
      throw new Error('No data received from server');
    }

    return res.data;
  } catch (error) {
    console.error('Transcribe error:', error);
    throw error;
  }
};
