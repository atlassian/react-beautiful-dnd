// @flow
import getDragHandleRef from './get-drag-handle-ref';
import { warning } from '../../../debug/dev-warning';
import type { DraggableId } from '../../../types';

type FocusRetainer = {|
  retain: (draggableId: DraggableId) => void,
  tryRestoreFocus: (
    draggableId: DraggableId,
    draggableRef: HTMLElement,
  ) => void,
|};

// our shared state
let retainingFocusFor: ?DraggableId = null;

// Using capture: true as focus events do not bubble
// Additionally doing this prevents us from intercepting the initial
// focus event as it does not bubble up to this listener
const listenerOptions = { capture: true };

// If we focus on
const clearRetentionOnFocusChange = (() => {
  let isBound: boolean = false;

  const bind = () => {
    if (isBound) {
      return;
    }

    isBound = true;

    // eslint-disable-next-line no-use-before-define
    window.addEventListener('focus', onWindowFocusChange, listenerOptions);
  };

  const unbind = () => {
    if (!isBound) {
      return;
    }

    isBound = false;
    // eslint-disable-next-line no-use-before-define
    window.removeEventListener('focus', onWindowFocusChange, listenerOptions);
  };

  // focusin will fire after the focus event fires on the element
  const onWindowFocusChange = () => {
    // unbinding self after single use
    unbind();
    retainingFocusFor = null;
  };

  const result = () => bind();
  result.cancel = () => unbind();

  return result;
})();

const retain = (id: DraggableId) => {
  retainingFocusFor = id;
  clearRetentionOnFocusChange();
};

const tryRestoreFocus = (id: DraggableId, draggableRef: HTMLElement) => {
  // Not needing to retain focus
  if (!retainingFocusFor) {
    return;
  }
  // Not needing to retain focus for this draggable
  if (id !== retainingFocusFor) {
    return;
  }

  // We are about to force focus onto a drag handle

  retainingFocusFor = null;
  // no need to clear it - we are already clearing it
  clearRetentionOnFocusChange.cancel();

  const dragHandleRef: ?HTMLElement = getDragHandleRef(draggableRef);

  if (!dragHandleRef) {
    warning('Could not find drag handle in the DOM to focus on it');
    return;
  }
  dragHandleRef.focus();
};

const retainer: FocusRetainer = {
  retain,
  tryRestoreFocus,
};

export default retainer;
