// @flow
import { useRef } from 'react';

// Using an object to hold the result incase the result is falsy
type Result<T> = {
  value: T,
};

// Similar to useMemo(() => T, []), but not subject to memoization purging
export function useConstant<T>(fn: () => T): T {
  const bucket = useRef<?Result<T>>(null);

  if (bucket.current) {
    return bucket.current.value;
  }

  bucket.current = {
    value: fn(),
  };

  return bucket.current.value;
}

export function useConstantFn<GetterFn: Function>(getter: GetterFn): GetterFn {
  // set bucket with original getter
  const bucket = useRef<GetterFn>(getter);
  // never override the original, just keep returning it
  return bucket.current;
}
