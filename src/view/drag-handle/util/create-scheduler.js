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
  const moveForward = rafSchd(callbacks.onMoveForward);
  const moveBackward = rafSchd(callbacks.onMoveBackward);
  const crossAxisMoveForward = rafSchd(callbacks.onCrossAxisMoveForward);
  const crossAxisMoveBackward = rafSchd(callbacks.onCrossAxisMoveBackward);
  const windowScrollMove = rafSchd(callbacks.onWindowScroll);

  const cancel = () => {
    // cancel all of the next animation frames

    move.cancel();
    moveForward.cancel();
    moveBackward.cancel();
    crossAxisMoveForward.cancel();
    crossAxisMoveBackward.cancel();
    windowScrollMove.cancel();
  };

  return {
    move,
    moveForward,
    moveBackward,
    crossAxisMoveForward,
    crossAxisMoveBackward,
    windowScrollMove,
    cancel,
  };
};
