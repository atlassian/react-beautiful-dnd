// @flow
import memoizeOne from 'memoize-one';
import rafSchedule from 'raf-schd';
import type { Position } from '../../../types';
import type { Callbacks } from '../drag-handle-types';

export default (callbacks: Callbacks, isDraggingFn: () => boolean) => {
  const ifDragging = (fn: Function) => {
    if (isDraggingFn()) {
      fn();
    }
  };

  const memoizedMove = memoizeOne((x: number, y: number) => {
    const point: Position = { x, y };
    callbacks.onMove(point);
  });

  const move = rafSchedule((point: Position) => {
    ifDragging(() => memoizedMove(point.x, point.y));
  });

  const moveForward = rafSchedule(() => {
    ifDragging(callbacks.onMoveForward);
  });

  const moveBackward = rafSchedule(() => {
    ifDragging(callbacks.onMoveBackward);
  });

  const crossAxisMoveForward = rafSchedule(() => {
    ifDragging(callbacks.onCrossAxisMoveForward);
  });

  const crossAxisMoveBackward = rafSchedule(() => {
    ifDragging(callbacks.onCrossAxisMoveBackward);
  });

  const windowScrollMove = rafSchedule(() => {
    ifDragging(callbacks.onWindowScroll);
  });

  return {
    move,
    moveForward,
    moveBackward,
    crossAxisMoveForward,
    crossAxisMoveBackward,
    windowScrollMove,
  };
};
