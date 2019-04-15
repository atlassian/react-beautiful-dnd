// @flow
import { useContext, type Context as ContextType } from 'react';
import invariant from 'tiny-invariant';

export default function useRequiredContext<T>(Context: ContextType<?T>): T {
  const result: ?T = useContext(Context);
  invariant(result, 'Could not find required context');
  return result;
}
