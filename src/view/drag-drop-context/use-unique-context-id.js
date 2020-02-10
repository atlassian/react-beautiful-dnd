// @flow
import { useMemo } from 'use-memo-one';
import type { ContextId } from '../../types';

let count = 0;

export function reset() {
  count = 0;
}

export default function useInstanceCount(): ContextId {
  return useMemo(() => `${count++}`, []);
}
