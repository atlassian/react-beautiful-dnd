// @flow
import { useRef, useState, useEffect } from 'react';
import areInputsEqual from './are-inputs-equal';

type Result<T> = {|
  inputs: mixed[],
  callback: T,
|};

export default function useCallbackOne<T: Function>(
  // getResult changes on every call,
  callback: T,
  // the inputs array changes on every call
  inputs?: mixed[] = [],
): T {
  // using useState to generate initial value as it is lazy
  const initial: Result<T> = useState(() => ({
    inputs,
    callback,
  }))[0];

  const uncommitted = useRef<Result<T>>(initial);
  const committed = useRef<Result<T>>(initial);

  // persist any uncommitted changes after they have been committed
  useEffect(() => {
    committed.current = uncommitted.current;
  });

  if (areInputsEqual(inputs, committed.current.inputs)) {
    return committed.current.callback;
  }

  uncommitted.current = {
    inputs,
    callback,
  };

  return uncommitted.current.callback;
}
