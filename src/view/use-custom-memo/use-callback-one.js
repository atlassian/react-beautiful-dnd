// @flow
import { useRef } from 'react';
import areInputsEqual from './are-inputs-equal';

export default function useCallbackOne<T: Function>(
  // getResult changes on every call,
  callback: T,
  // the inputs array changes on every call
  inputs?: mixed[] = [],
): T {
  const isFirstCallRef = useRef<boolean>(true);
  const lastInputsRef = useRef<any[]>(inputs);
  // Cannot lazy create a ref value, so setting to null
  // $ExpectError - T is not null
  const resultRef = useRef<T>(null);

  // on first call return the initial result
  if (isFirstCallRef.current) {
    isFirstCallRef.current = false;
    resultRef.current = callback;
    return resultRef.current;
  }

  // Don't recalculate result if the inputs have not changed
  if (areInputsEqual(inputs, lastInputsRef.current)) {
    return resultRef.current;
  }

  lastInputsRef.current = inputs;
  resultRef.current = callback;
  return resultRef.current;
}
