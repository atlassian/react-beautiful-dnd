// @flow
import invariant from 'tiny-invariant';
import { useRef } from 'react';
import type { Args } from './drag-handle-types';
import usePrevious from '../use-previous-ref';
import focusRetainer from './util/focus-retainer';
import getDragHandleRef from './util/get-drag-handle-ref';
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';
import useCallbackOne from '../use-custom-memo/use-callback-one';

export type Result = {|
  onBlur: () => void,
  onFocus: () => void,
|};

function noop() {}

export default function useFocusRetainer(args: Args): Result {
  const isFocusedRef = useRef<boolean>(false);
  const lastArgsRef = usePrevious<Args>(args);
  const { getDraggableRef } = args;

  const onFocus = useCallbackOne(() => {
    isFocusedRef.current = true;
  }, []);
  const onBlur = useCallbackOne(() => {
    isFocusedRef.current = false;
  }, []);

  useIsomorphicLayoutEffect(() => {
    // mounting: try to restore focus
    const first: Args = lastArgsRef.current;
    if (!first.isEnabled) {
      return noop;
    }
    const draggable: ?HTMLElement = getDraggableRef();
    invariant(draggable, 'Drag handle could not obtain draggable ref');

    const dragHandle: HTMLElement = getDragHandleRef(draggable);

    focusRetainer.tryRestoreFocus(first.draggableId, dragHandle);

    // unmounting: try to retain focus
    return () => {
      const last: Args = lastArgsRef.current;
      const shouldRetainFocus = ((): boolean => {
        // will not restore if not enabled
        if (!last.isEnabled) {
          return false;
        }
        // not focused
        if (!isFocusedRef.current) {
          return false;
        }

        // a drag is finishing
        return last.isDragging || last.isDropAnimating;
      })();

      if (shouldRetainFocus) {
        focusRetainer.retain(last.draggableId);
      }
    };
  }, [getDraggableRef, lastArgsRef]);

  const lastDraggableRef = useRef<?HTMLElement>(getDraggableRef());

  useIsomorphicLayoutEffect(() => {
    const draggableRef: ?HTMLElement = getDraggableRef();

    // Cannot focus on nothing
    if (!draggableRef) {
      return;
    }

    // no change in ref
    if (draggableRef === lastArgsRef.current.draggableId) {
      return;
    }

    // ref has changed - let's do this
    if (isFocusedRef.current && lastArgsRef.current.isEnabled) {
      getDragHandleRef(draggableRef).focus();
    }

    // Doing our own should run check
  });

  useIsomorphicLayoutEffect(() => {
    lastDraggableRef.current = getDraggableRef();
  });

  return { onBlur, onFocus };
}
