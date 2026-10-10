import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { appEventBus } from '../services/eventBus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sseUrl = `${API_URL}/events/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type) {
            appEventBus.emit(data.type, data);
            if (data.type === 'CONNECTED') {
              appEventBus.emit('RECONNECTED', data);
            }
          }
        } catch (e) {
          console.error('SSE Parse error', e);
        }
      };

      es.onerror = (error) => {
        console.error('SSE connection error...', error);
        // Do NOT manually close or reconnect. The browser automatically reconnects EventSource.
        // If it's a fatal error, we could handle it, but standard network drops will auto-reconnect.
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [token, isAuthenticated]);

  return <>{children}</>;
}