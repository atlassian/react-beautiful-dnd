// @flow
import { useEffect } from 'react';
import { error } from '../dev-warning';

export default function useDevSetupWarning(fn: () => void, inputs?: mixed[]) {
  // Don't run any validation in production
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      try {
        fn();
      } catch (e) {
        error(`
          A setup problem was encountered.

          > ${e.message}
        `);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, inputs);
  }
}
