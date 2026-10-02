import { useEffect } from 'react';
import { appEventBus } from '../services/eventBus';

export function useAppEvent(eventName: string | string[], callback: (payload?: any) => void) {
  useEffect(() => {
    const events = Array.isArray(eventName) ? eventName : [eventName];
    const unsubscribes = events.map(ev => appEventBus.on(ev, callback));
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [eventName, callback]);
}