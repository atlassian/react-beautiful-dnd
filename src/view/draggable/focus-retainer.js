// @flow
import focusOnDragHandle from './focus-on-drag-handle';
import * as attributes from '../data-attributes';
import type { DraggableId } from '../../types';

type FocusRetainer = {|
  onDragHandleFocus: (draggableId: DraggableId) => void,
  onDragHandleBlur: () => void,
  tryRestoreFocus: (draggableId: DraggableId, draggableRef: HTMLElement) => void,
|}

// our shared state
let retainingFocusFor: ?DraggableId = null;

// If we focus on
const clearRetentionOnFocusShift = (() => {
  let isBound: boolean = false;

  const bind = () => {
    if (isBound) {
      return;
    }

    isBound = true;
    // eslint-disable-next-line no-use-before-define
    window.addEventListener('focus', onWindowFocusChange, { capture: true });
  };

  const unbind = () => {
    if (!isBound) {
      return;
    }

    isBound = false;
    // eslint-disable-next-line no-use-before-define
    window.removeEventListener('focus', onWindowFocusChange, { capture: true });
  };

  // focusin will fire after the focus event fires on the element
  const onWindowFocusChange = (event: FocusEvent) => {
    // unbinding self after single use
    unbind();

    if (!(event.target instanceof HTMLElement)) {
      // we are not focusing on a drag handle
      retainingFocusFor = null;
      return;
    }

    const isADragHandle: boolean = Boolean(event.target.getAttribute(attributes.dragHandle));

    // The focus has shifted away from a drag handle - we can clear our retention
    if (!isADragHandle) {
      retainingFocusFor = null;
    }
  };

  const result = () => bind();
  result.cancel = () => unbind();

  return result;
})();

const clearRetention = () => {
  retainingFocusFor = null;
  // no need to clear it - we are already clearing it
  clearRetentionOnFocusShift.cancel();
};

const onDragHandleFocus = (id: DraggableId) => {
  retainingFocusFor = id;
  clearRetentionOnFocusShift();
};

const onDragHandleBlur = () => clearRetention();

const tryRestoreFocus = (id: DraggableId, draggableRef: HTMLElement) => {
  // Not needing to retain focus
  if (!retainingFocusFor) {
    return;
  }
  // Not needing to retain focus for this draggable
  if (id !== retainingFocusFor) {
    return;
  }

  // We are about to force force onto a drag handle

  clearRetention();
  focusOnDragHandle(draggableRef);
};

const retainer: FocusRetainer = {
  onDragHandleFocus,
  onDragHandleBlur,
  tryRestoreFocus,
};

export default retainer;
