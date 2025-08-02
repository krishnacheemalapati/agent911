export class CallWebSocket {
  private ws: WebSocket | null = null;
  private listeners: ((data: any) => void)[] = [];

  constructor(callId: number) {
    this.ws = new WebSocket(`ws://localhost:8000/ws/calls/${callId}/`);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach((cb) => cb(data));
    };
  }

  sendAudioChunk(chunk: ArrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  onTranscript(cb: (data: any) => void) {
    this.listeners.push(cb);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}
