// @flow
import type { Position } from 'css-box-model';
import { useRef, useCallback } from 'react';

type Result = (event: MouseEvent) => void;

export default function useMouseSensor(args: Args): Result {
  const pendingRef = useRef<?Position>(null);
  const isDraggingRef = useRef<boolean>(false);

  const bindWindowEvents = useCallback((point: Position) => {});

  const startPendingDrag = useCallback((point: Position) => {
    pendingRef.current = point;
  }, []);

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      const point: Position = {
        x: event.clientX,
        y: event.clientY,
      };

      startPendingDrag(point);
    },
    [startPendingDrag],
  );

  return onMouseDown;
}
