// @flow
import { useRef } from 'react';
import { warning } from '../../../../src/dev-warning';

export function useConstantValue<T>(fn: () => T): T {
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

export function useConstantFn<T>(getFn: () => () => T): () => T {
  const bucket = useRef<?() => T>(null);

  if (bucket.current) {
    return bucket.current;
  }

  bucket.current = getFn();
  return bucket.current;
}
