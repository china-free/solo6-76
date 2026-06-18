import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface DebouncedCallbackOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  options: DebouncedCallbackOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true } = options;
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invoke = useCallback((args: Parameters<T>) => {
    lastInvokeTimeRef.current = Date.now();
    callbackRef.current(...args);
  }, []);

  const startTimer = useCallback(
    (args: Parameters<T>) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        if (trailing && lastArgsRef.current) {
          invoke(lastArgsRef.current);
        }
        timerRef.current = null;
        lastArgsRef.current = null;
      }, delay);
    },
    [delay, trailing, invoke]
  );

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      const now = Date.now();
      const isLeading = leading && timerRef.current === null;
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

      if (isLeading && timeSinceLastInvoke >= delay) {
        invoke(args);
        startTimer(args);
        return;
      }

      startTimer(args);
    },
    [leading, delay, invoke, startTimer]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debounced;
}

export function useThrottle<T>(value: T, limit: number = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRunRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limit) {
      lastRunRef.current = now;
      setThrottledValue(value);
    } else {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        setThrottledValue(value);
      }, limit - timeSinceLastRun);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, limit]);

  return throttledValue;
}

interface ThrottledCallbackOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 200,
  options: ThrottledCallbackOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;
  const callbackRef = useRef(callback);
  const lastRunRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invoke = useCallback((args: Parameters<T>) => {
    lastRunRef.current = Date.now();
    callbackRef.current(...args);
  }, []);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      lastArgsRef.current = args;

      if (timeSinceLastRun >= limit) {
        if (leading) {
          invoke(args);
        } else {
          lastRunRef.current = now;
        }

        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else if (trailing && timerRef.current === null) {
        timerRef.current = setTimeout(() => {
          if (lastArgsRef.current) {
            invoke(lastArgsRef.current);
          }
          timerRef.current = null;
          lastArgsRef.current = null;
        }, limit - timeSinceLastRun);
      }
    },
    [limit, leading, trailing, invoke]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return throttled;
}
