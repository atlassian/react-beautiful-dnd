// @flow
import { useMemo } from 'use-memo-one';
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
  return useMemo(() => `${prefix}${options.separator}${count++}`, [
    options.separator,
    prefix,
  ]);
}
