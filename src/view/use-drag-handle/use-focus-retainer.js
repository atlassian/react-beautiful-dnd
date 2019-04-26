// @flow
import invariant from 'tiny-invariant';
import { useRef } from 'react';
import { useCallback } from 'use-memo-one';
import type { Args } from './drag-handle-types';
import usePrevious from '../use-previous-ref';
import focusRetainer from './util/focus-retainer';
import getDragHandleRef from './util/get-drag-handle-ref';
import useLayoutEffect from '../use-isomorphic-layout-effect';

export type Result = {|
  onBlur: () => void,
  onFocus: () => void,
|};

function noop() {}

export default function useFocusRetainer(args: Args): Result {
  const isFocusedRef = useRef<boolean>(false);
  const lastArgsRef = usePrevious<Args>(args);
  const { getDraggableRef } = args;

  const onFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);
  const onBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  // This effect handles:
  // - giving focus on mount
  // - registering focus on unmount
  useLayoutEffect(() => {
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

  // will always be null on the first render as nothing has mounted yet
  const lastDraggableRef = useRef<?HTMLElement>(null);

  // This effect restores focus to an element when a
  // ref changes while a component is still mounted.
  // This can happen when a drag handle is moved into a portal
  useLayoutEffect(() => {
    // this can happen on the first mount - no draggable ref is set
    // this effect is not handling initial mounting
    if (!lastDraggableRef.current) {
      return;
    }

    const draggableRef: ?HTMLElement = getDraggableRef();

    // Cannot focus on nothing
    if (!draggableRef) {
      return;
    }

    // no change in ref
    if (draggableRef === lastDraggableRef.current) {
      return;
    }

    // ref has changed - let's do this
    if (isFocusedRef.current && lastArgsRef.current.isEnabled) {
      getDragHandleRef(draggableRef).focus();
    }

    // Doing our own should run check
  });

  useLayoutEffect(() => {
    lastDraggableRef.current = getDraggableRef();
  });

  return { onBlur, onFocus };
}
