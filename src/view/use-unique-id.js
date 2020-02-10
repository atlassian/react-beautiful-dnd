// @flow
import { useRef } from 'react';
import type { Id } from '../types';

let count: number = 0;

type Options = {
  separator: string,
};

const defaults: Options = { separator: '::' };

export function reset() {
  count = 0;
}

export default function useUniqueId(
  prefix: string,
  options?: Options = defaults,
): Id {
  const countRef = useRef<number>(count++);

  return `${prefix}${options.separator}${countRef.current}`;
}
