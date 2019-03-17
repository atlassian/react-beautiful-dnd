// @flow
import { useRef } from 'react';
import { warning } from '../dev-warning';

export function useConstant<T>(fn: () => T): T {
  const bucket = useRef<?T>(null);

  if (bucket.current) {
    return bucket.current;
  }

  bucket.current = fn();

  if (!bucket.current) {
    warning('Expected constantFn to be truthy');
  }
  return bucket.current;
}

export function useConstantFn<GetterFn: Function>(getter: GetterFn): GetterFn {
  // set bucket with original getter
  const bucket = useRef<GetterFn>(getter);
  // never override the original, just keep returning it
  return bucket.current;
}
