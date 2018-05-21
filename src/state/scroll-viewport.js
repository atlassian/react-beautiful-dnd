// @flow
import { getRect, type Rect } from 'css-box-model';
import type { Position } from 'css-box-model';
import { subtract, negate } from './position';
import { offsetByPosition } from './spacing';
import type { Viewport } from '../types';

export default (viewport: Viewport, newScroll: Position): Viewport => {
  const diff: Position = subtract(newScroll, viewport.scroll.initial);
  const displacement: Position = negate(diff);

  const frame: Rect = getRect(
    offsetByPosition(viewport.frame, diff)
  );

  console.log('scroll change recorded:', diff);
  console.log('window scroll is now', newScroll)

  const updated: Viewport = {
    frame,
    scroll: {
      initial: viewport.scroll.initial,
      max: viewport.scroll.max,
      current: newScroll,
      diff: {
        value: diff,
        displacement,
      },
    },
  };

  return updated;
};

