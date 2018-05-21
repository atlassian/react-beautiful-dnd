// @flow
import { getRect, type Position, type Rect } from 'css-box-model';
import type { Viewport } from '../../../src/types';
import { add, negate } from '../../../src/state/position';
import scrollViewport from '../../../src/state/scroll-viewport';
import { offsetByPosition } from '../../../src/state/spacing';

const origin: Position = { x: 0, y: 0 };

it('should update the window details scroll', () => {
  const original: Viewport = {
    frame: getRect({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    }),
    scroll: {
      initial: origin,
      current: origin,
      max: { x: 1000, y: 1000 },
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };
  const newScroll: Position = { x: 100, y: 50 };
  const expected: Viewport = {
    frame: getRect({
      // shifted 50
      top: 50,
      bottom: 150,
      // shifted 100
      left: 100,
      right: 200,
    }),
    scroll: {
      initial: origin,
      current: newScroll,
      max: { x: 1000, y: 1000 },
      diff: {
        value: newScroll,
        displacement: negate(newScroll),
      },
    },
  };

  const updated: Viewport = scrollViewport(original, newScroll);

  expect(updated).toEqual(expected);
});

it('should correctly update scroll across multiple movements', () => {
  const original: Rect = getRect({
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  });

  let lastViewport: Viewport = {
    frame: original,
    scroll: {
      initial: origin,
      current: origin,
      max: { x: 1000, y: 1000 },
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };

  let lastScroll: Position = origin;

  Array.from({ length: 5 }).forEach(() => {
    const newScroll: Position = add(lastScroll, { x: 10, y: 20 });
    const updated: Viewport = scrollViewport(lastViewport, newScroll);

    const expected: Viewport = {
      frame: getRect(offsetByPosition(original, newScroll)),
      scroll: {
        initial: origin,
        current: newScroll,
        max: { x: 1000, y: 1000 },
        diff: {
          value: newScroll,
          displacement: negate(newScroll),
        },
      },
    };
    expect(updated).toEqual(expected);
    expect(updated.frame.top).toEqual(newScroll.y);
    expect(updated.frame.left).toEqual(newScroll.x);

    lastScroll = newScroll;
    lastViewport = updated;
  });
});
