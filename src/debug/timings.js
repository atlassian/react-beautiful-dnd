// @flow

type Records = {
  [key: string]: number,
}

const records: Records = {};

const flag: string = '__react-beautiful-dnd-debug-timings-hook__';

const isTimingsEnabled = (): boolean => Boolean(window[flag]);

export const start = (key: string) => {
  if (!isTimingsEnabled()) {
    return;
  }
  const now: number = performance.now();

  records[key] = now;
};

export const finish = (key: string) => {
  if (!isTimingsEnabled()) {
    return;
  }
  const now: number = performance.now();

  const previous: ?number = records[key];

  if (previous == null) {
    console.error('cannot finish timing as no previous time found');
    return;
  }

  const result: number = now - previous;

  // eslint-disable-next-line no-console
  console.log(`%cTiming (${key}): %c${result} %cms`, 'font-weight: bold;', 'color: blue;', 'color: grey;');
};

