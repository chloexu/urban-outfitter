import { useState, useRef, useCallback } from 'react';
// @ts-ignore
import EventSource from 'react-native-sse';
import { sseUrl } from '../lib/api';

export type SearchResult = {
  retailer: string;
  product_name: string;
  price: number;
  image_url: string;
  product_url: string;
};

export function useSSE() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<InstanceType<typeof EventSource> | null>(null);

  const connect = useCallback((sessionId: string, token: string) => {
    setResults([]);
    setProgress(null);
    setDone(false);
    setError(null);

    const url = sseUrl(sessionId, token);
    const es = new EventSource(url) as any;
    esRef.current = es;

    es.addEventListener('progress', (e: any) => {
      const data = JSON.parse(e.data);
      setProgress(data.message);
    });

    es.addEventListener('result', (e: any) => {
      const data = JSON.parse(e.data);
      setResults((prev) => [...prev, data.item]);
    });

    es.addEventListener('search_complete', () => {
      setDone(true);
      es.close();
    });

    es.addEventListener('batch_complete', (e: any) => {
      const data = JSON.parse(e.data);
      setProgress(`Found ${data.total_so_far} items so far...`);
    });

    es.addEventListener('error', (e: any) => {
      // e.data present = retailer-level error (non-fatal), stream continues
      // e.data absent  = connection-level error (fatal), close stream
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          setProgress(`Skipped: ${data.retailer ?? 'unknown'} (${data.message ?? 'error'})`);
        } catch {
          // ignore malformed error data
        }
      } else {
        setError('Connection lost');
        es.close();
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  return { results, progress, done, error, connect, disconnect };
}
