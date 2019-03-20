// @flow
import { useRef } from 'react';

const isShallowEqual = (newValue: mixed, oldValue: mixed): boolean =>
  newValue === oldValue;

const isEqual = (newInputs: mixed[], lastInputs: mixed[]): boolean =>
  newInputs.length === lastInputs.length &&
  newInputs.every(
    (newArg: mixed, index: number): boolean =>
      isShallowEqual(newArg, lastInputs[index]),
  );

export default function useMemoOne<T>(
  // getResult changes on every call,
  getResult: () => T,
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
    resultRef.current = getResult();
    return resultRef.current;
  }

  // Don't recalculate result if the inputs have not changed
  if (isEqual(inputs, lastInputsRef.current)) {
    return resultRef.current;
  }

  lastInputsRef.current = inputs;
  resultRef.current = getResult();
  return resultRef.current;
}
