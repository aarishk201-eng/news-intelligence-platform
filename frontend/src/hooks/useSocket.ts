'use client';

/**
 * @module hooks/useSocket
 * @description Custom React hook for Socket.IO connection management
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
}

/**
 * Custom hook for Socket.IO connection
 * @param namespace - Socket.IO namespace (e.g., '/news', '/trending')
 * @param options - Socket.IO configuration options
 * @returns Socket connection interface with methods
 */
export const useSocket = (
  namespace: string = '/',
  options: UseSocketOptions = {}
): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionDelay = 1000,
    reconnectionDelayMax = 5000,
    reconnectionAttempts = 5,
  } = options;

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect || socketRef.current) return;

    try {
      const socketURL = process.env.NEXT_PUBLIC_SOCKETIO_URL || 'http://localhost:5005';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const socket = io(`${socketURL}${namespace}`, {
        reconnection,
        reconnectionDelay,
        reconnectionDelayMax,
        reconnectionAttempts,
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
      });

      // Connection events
      socket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        console.log(`✅ Connected to ${namespace}`);
      });

      socket.on('connect_error', (err: Error) => {
        setError(err);
        setIsConnecting(false);
        console.warn(`⚠️ Connection error on ${namespace}:`, err.message);
      });

      socket.on('disconnect', (reason: string) => {
        setIsConnected(false);
        console.log(`❌ Disconnected from ${namespace}:`, reason);
      });

      socket.on('error', (err: unknown) => {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        console.error(`🔴 Socket error on ${namespace}:`, errorObj);
      });

      socket.on('connecting', () => {
        setIsConnecting(true);
      });

      socketRef.current = socket;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Failed to initialize socket:', errorObj);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [namespace, autoConnect, reconnection, reconnectionDelay, reconnectionDelayMax, reconnectionAttempts]);

  // Emit event
  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      } else {
        console.warn(`Socket not connected, cannot emit ${event}`);
      }
    },
    []
  );

  // Listen to event
  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Stop listening to event
  const off = useCallback((event: string, callback?: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    emit,
    on,
    off,
  };
};
