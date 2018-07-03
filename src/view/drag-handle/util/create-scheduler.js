// @flow
import { type Position } from 'css-box-model';
import memoizeOne from 'memoize-one';
import rafSchd from 'raf-schd';
import type { Callbacks } from '../drag-handle-types';

export default (callbacks: Callbacks) => {
  const memoizedMove = memoizeOne((x: number, y: number) => {
    const point: Position = { x, y };
    callbacks.onMove(point);
  });

  const move = rafSchd((point: Position) => memoizedMove(point.x, point.y));
  const moveUp = rafSchd(callbacks.onMoveUp);
  const moveDown = rafSchd(callbacks.onMoveDown);
  const moveRight = rafSchd(callbacks.onMoveRight);
  const moveLeft = rafSchd(callbacks.onMoveLeft);
  const windowScrollMove = rafSchd(callbacks.onWindowScroll);

  const cancel = () => {
    // cancel all of the next animation frames

    move.cancel();
    moveUp.cancel();
    moveDown.cancel();
    moveRight.cancel();
    moveLeft.cancel();
    windowScrollMove.cancel();
  };

  return {
    move,
    moveUp,
    moveDown,
    moveRight,
    moveLeft,
    windowScrollMove,
    cancel,
  };
};
