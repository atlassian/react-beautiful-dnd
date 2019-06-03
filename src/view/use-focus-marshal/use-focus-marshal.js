// @flow
import { useRef } from 'react';
import { useMemo, useCallback } from 'use-memo-one';
import type { DraggableId, ContextId } from '../../types';
import type { FocusMarshal, Unregister } from './focus-marshal-types';
import { dragHandle as dragHandleAttr } from '../data-attributes';
import { warning } from '../../dev-warning';
import useLayoutEffect from '../use-isomorphic-layout-effect';

type Entry = {|
  id: DraggableId,
  focus: () => void,
|};

type EntryMap = {
  [id: DraggableId]: Entry,
};

function getDragHandle(
  contextId: ContextId,
  draggableId: DraggableId,
): ?HTMLElement {
  // find the drag handle
  const selector: string = `[${dragHandleAttr.contextId}="${contextId}"]`;
  const possible: Element[] = Array.from(document.querySelectorAll(selector));

  if (!possible.length) {
    warning(`Unable to find any drag handles in the context "${contextId}"`);
    return null;
  }

  const handle: ?Element = possible.find(
    (el: Element): boolean => {
      return el.getAttribute(dragHandleAttr.draggableId) === draggableId;
    },
  );

  if (!handle) {
    warning(
      `Unable to find drag handle with id "${draggableId}" as no handle with a matching id was found`,
    );
    return null;
  }

  if (!(handle instanceof HTMLElement)) {
    warning(`Drag handle is not a HTMLElement`);
    return null;
  }

  return handle;
}

export default function useFocusMarshal(contextId: ContextId): FocusMarshal {
  const entriesRef = useRef<EntryMap>({});
  const recordRef = useRef<?DraggableId>(null);
  const restoreFocusFrameRef = useRef<?AnimationFrameID>(null);

  const register = useCallback(function register(
    id: DraggableId,
    focus: () => void,
  ): Unregister {
    const entry: Entry = { id, focus };
    entriesRef.current[id] = entry;

    return function unregister() {
      const entries: EntryMap = entriesRef.current;
      const current: Entry = entries[id];
      // entry might have been overrided by another registration
      if (current !== entry) {
        delete entries[id];
      }
    };
  },
  []);

  const tryGiveFocus = useCallback(
    function tryGiveFocus(tryGiveFocusTo: DraggableId) {
      const handle: ?HTMLElement = getDragHandle(contextId, tryGiveFocusTo);

      if (handle && handle !== document.activeElement) {
        handle.focus();
      }
    },
    [contextId],
  );

  const tryShiftRecord = useCallback(function tryShiftRecord(
    previous: DraggableId,
    redirectTo: DraggableId,
  ) {
    if (recordRef.current === previous) {
      recordRef.current = redirectTo;
    }
  },
  []);

  const tryRestoreFocusRecorded = useCallback(
    function tryRestoreFocusRecorded() {
      restoreFocusFrameRef.current = requestAnimationFrame(() => {
        restoreFocusFrameRef.current = null;
        const record: ?DraggableId = recordRef.current;
        if (record) {
          tryGiveFocus(record);
        }
      });
    },
    [tryGiveFocus],
  );

  function tryRecordFocus(id: DraggableId) {
    // clear any existing record
    recordRef.current = null;

    const focused: ?Element = document.activeElement;

    // no item focused so it cannot be our item
    if (!focused) {
      return;
    }

    // focused element is not a drag handle or does not have the right id
    if (focused.getAttribute(dragHandleAttr.draggableId) !== id) {
      return;
    }

    recordRef.current = id;
  }

  useLayoutEffect(() => {
    return function clearFrameOnUnmount() {
      const frameId: ?AnimationFrameID = restoreFocusFrameRef.current;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const marshal: FocusMarshal = useMemo(
    () => ({
      register,
      tryRecordFocus,
      tryRestoreFocusRecorded,
      tryShiftRecord,
    }),
    [register, tryRestoreFocusRecorded, tryShiftRecord],
  );

  return marshal;
}
