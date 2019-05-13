// @flow
import { useEffect } from 'react';
import { useCallback } from 'use-memo-one';
import type { PreDragActions, DragActions } from '../types';

function delay(fn: Function, time?: number = 300) {
  return new Promise(resolve => {
    setTimeout(() => {
      fn();
      resolve();
    }, time);
  });
}

function noop() {}

export default function useDemoSensor(
  tryGetActionLock: (
    source: Event | Element,
    abort: () => void,
  ) => ?PreDragActions,
) {
  const start = useCallback(
    async function start() {
      // grabbing the first drag handle we can
      const handle: ?HTMLElement = document.querySelector(
        '[data-rbd-drag-handle-context-id]',
      );
      if (!handle) {
        console.log('could not find drag handle');
        return;
      }

      // handle.scrollIntoView();

      const preDrag: ?PreDragActions = tryGetActionLock(handle, noop);

      if (!preDrag) {
        console.log('unable to start drag');
        return;
      }

      const actions: DragActions = preDrag.lift({
        mode: 'SNAP',
      });
      const { moveDown, moveUp, drop } = actions;

      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveUp);
      await delay(moveUp);
      await delay(drop);
    },
    [tryGetActionLock],
  );

  useEffect(() => {
    start();
  }, [start]);
}
