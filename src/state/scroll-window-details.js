// @flow
import type { Position } from 'css-box-model';
import { subtract, negate } from './position';
import type { WindowDetails, Viewport } from '../types';

export default (windowDetails: WindowDetails, newScroll: Position): WindowDetails => {
  const diff: Position = subtract(newScroll, windowDetails.scroll.initial);
  const displacement: Position = negate(diff);

  const viewport: Viewport = {
    ...windowDetails.viewport,
    scroll: newScroll,
  };

  const updated: WindowDetails = {
    viewport,
    scroll: {
      initial: windowDetails.scroll.initial,
      current: newScroll,
      diff: {
        value: diff,
        displacement,
      },
    },
  };

  return updated;
};

