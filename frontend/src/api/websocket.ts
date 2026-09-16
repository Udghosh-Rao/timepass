type Listener = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: { [type: string]: Listener[] } = {};
  private reconnectTimer: any = null;

  connect() {
    if (this.ws) return;
    
    // In Vite dev, assume WS is same host but port 8000
    this.ws = new WebSocket('ws://localhost:8000/api/v1/ws');

    this.ws.onopen = () => {
      console.log('WS Connected');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type;
        if (type && this.listeners[type]) {
          this.listeners[type].forEach(cb => cb(data));
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    this.ws.onclose = () => {
      console.log('WS Disconnected');
      this.ws = null;
      // Auto-reconnect
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (err) => {
      console.error('WS Error', err);
      this.ws?.close();
    };
  }

  subscribe(type: string, callback: Listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
    return () => {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    };
  }
}

export const wsClient = new WebSocketClient();
