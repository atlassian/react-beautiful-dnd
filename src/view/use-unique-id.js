// @flow
import { useRef } from 'react';
import type { Id } from '../types';

let count: number = 0;

export default function useUniqueId(prefix: string): Id {
  const countRef = useRef<number>(count++);

  return `${prefix}::${countRef.current}`;
}
