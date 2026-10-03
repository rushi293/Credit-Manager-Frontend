import { useEffect, useRef } from 'react';
import { appEventBus } from '../services/eventBus';

export function useAppEvent(eventName: string | string[], callback: (payload?: any) => void) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const events = Array.isArray(eventName) ? eventName : [eventName];
    
    let timeout: any = null;
    let lastPayload: any = null;

    const debouncedCallback = (payload?: any) => {
      lastPayload = payload;
      if (timeout) return;
      timeout = setTimeout(() => {
        timeout = null;
        callbackRef.current(lastPayload);
      }, 50);
    };

    const unsubscribes = events.map(ev => appEventBus.on(ev, debouncedCallback));
    
    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribes.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(eventName)]);
}
