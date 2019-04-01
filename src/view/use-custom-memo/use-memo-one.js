// @flow
import { useRef, useState, useEffect } from 'react';
import areInputsEqual from './are-inputs-equal';

type Result<T> = {|
  inputs: mixed[],
  result: T,
|};

export default function useMemoOne<T>(
  // getResult changes on every call,
  getResult: () => T,
  // the inputs array changes on every call
  inputs?: mixed[] = [],
): T {
  // using useState to generate initial value as it is lazy
  const initial: Result<T> = useState(() => ({
    inputs,
    result: getResult(),
  }))[0];

  const uncommitted = useRef<Result<T>>(initial);
  const committed = useRef<Result<T>>(initial);

  // persist any uncommitted changes after they have been committed
  useEffect(() => {
    committed.current = uncommitted.current;
  });

  if (areInputsEqual(inputs, committed.current.inputs)) {
    return committed.current.result;
  }

  uncommitted.current = {
    inputs,
    result: getResult(),
  };

  return uncommitted.current.result;
}
