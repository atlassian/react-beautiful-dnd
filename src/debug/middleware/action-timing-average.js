// @flow
/* eslint-disable no-console */
import type { Action } from '../../state/store-types';

type Bucket = {
  [key: string]: number[],
};

const average = (values: number[]): number => {
  const sum: number = values.reduce(
    (previous: number, current: number) => previous + current,
    0,
  );
  return sum / values.length;
};

export default (groupSize: number) => {
  console.log('Starting average action timer middleware');
  console.log(`Will take an average every ${groupSize} actions`);
  const bucket: Bucket = {};

  return () => (next: (Action) => mixed) => (action: Action): any => {
    const start: number = performance.now();

    const result: mixed = next(action);

    const end: number = performance.now();

    const duration: number = end - start;

    if (!bucket[action.type]) {
      bucket[action.type] = [duration];
      return result;
    }

    bucket[action.type].push(duration);

    if (bucket[action.type].length < groupSize) {
      return result;
    }

    console.warn(
      `Average time for ${action.type}`,
      average(bucket[action.type]),
    );

    // reset
    bucket[action.type] = [];

    return result;
  };
};
