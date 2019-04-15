// @flow
import { useRef, useEffect } from 'react';

// Should return MutableRefObject<T> but I cannot import this type from 'react';
// $ExpectError - MutableRefObject I want you
export default function usePrevious<T>(current: T): MutableRefObject<T> {
  const ref = useRef<T>(current);

  // will be updated on the next render
  useEffect(() => {
    ref.current = current;
  });

  // return the existing current (pre render)
  return ref;
}
