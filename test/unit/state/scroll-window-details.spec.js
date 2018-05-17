// @flow
import type { Position } from 'css-box-model';
import type { WindowDetails, Viewport } from '../../../src/types';
import { negate } from '../../../src/state/position';
import scrollWindowDetails from '../../../src/state/scroll-window-details';
import getViewport from '../../../src/view/window/get-viewport';

const origin: Position = { x: 0, y: 0 };

it('should update the window details scroll', () => {
  const viewport: Viewport = getViewport();
  const original: WindowDetails = {
    viewport,
    scroll: {
      initial: origin,
      current: origin,
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };
  const newScroll: Position = { x: 100, y: 50 };
  const expected: WindowDetails = {
    viewport: {
      ...viewport,
      scroll: newScroll,
    },
    scroll: {
      initial: origin,
      current: newScroll,
      diff: {
        value: newScroll,
        displacement: negate(newScroll),
      },
    },
  };

  const updated: WindowDetails = scrollWindowDetails(original, newScroll);

  expect(updated).toEqual(expected);
});
