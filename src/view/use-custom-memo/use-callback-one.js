// @flow
import useMemoOne from './use-memo-one';

export default function useCallbackOne<T: Function>(
  // getResult changes on every call,
  callback: T,
  // the inputs array changes on every call
  inputs?: mixed[] = [],
): T {
  return useMemoOne(() => callback, inputs);
}
