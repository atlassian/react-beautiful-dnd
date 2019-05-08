// @flow
import { useRef, useEffect } from 'react';

export default function usePrevious<T>(current: T): {| current: T |} {
  const ref = useRef<T>(current);

  // will be updated on the next render
  useEffect(() => {
    ref.current = current;
  });

  // return the existing current (pre render)
  return ref;
}
