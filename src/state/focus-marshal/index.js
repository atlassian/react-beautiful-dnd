// @flow
import type { DraggableId, ContextId } from '../../types';
// TODO: move out of state?
import { dragHandle as dragHandleAttr } from '../../view/data-attributes';
import { warning } from '../../dev-warning';

type Unregister = () => void;

export type Register = (id: DraggableId, focus: () => void) => Unregister;

export type FocusMarshal = {|
  register: Register,
  tryRecordFocus: (tryRecordFor: DraggableId) => void,
  tryRestoreFocusRecorded: () => void,
  tryGiveFocus: (tryGiveFocusTo: DraggableId) => void,
|};

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

export default function create(contextId: ContextId): FocusMarshal {
  const entries: EntryMap = {};
  let hadFocus: ?DraggableId = null;

  function register(id: DraggableId, focus: () => void): Unregister {
    const entry: Entry = { id, focus };
    entries[id] = entry;

    return function unregister() {
      const current: Entry = entries[id];
      // entry might have been overrided by another registration
      if (current !== entry) {
        delete entries[id];
      }
    };
  }

  function tryGiveFocus(tryGiveFocusTo: DraggableId) {
    const handle: ?HTMLElement = getDragHandle(contextId, tryGiveFocusTo);

    if (handle && handle !== document.activeElement) {
      console.log('giving focus to ', tryGiveFocusTo);
      handle.focus();
    }
  }

  function tryRestoreFocusRecorded() {
    requestAnimationFrame(() => {
      if (hadFocus) {
        tryGiveFocus(hadFocus);
      }
    });
  }

  function tryRecordFocus(id: DraggableId) {
    // clear any existing record
    hadFocus = null;

    const focused: ?Element = document.activeElement;

    // no item focused so it cannot be our item
    if (!focused) {
      return;
    }

    // focused element is not a drag handle or does not have the right id
    if (focused.getAttribute(dragHandleAttr.draggableId) !== id) {
      return;
    }

    hadFocus = id;
  }

  return {
    register,
    tryRecordFocus,
    tryRestoreFocusRecorded,
    tryGiveFocus,
  };
}
