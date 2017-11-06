// @flow
import type { MouseForceChangedEvent } from '../drag-handle-types';

export default (event: MouseForceChangedEvent): boolean => {
  if (event.webkitForce == null || MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN == null) {
    console.error('handling a mouse force changed event when it is not supported');
    return false;
  }

  const forcePressThreshold: number = (MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN : any);

  // not a force press
  const isForcePressing: boolean = event.webkitForce >= forcePressThreshold;

  return isForcePressing;
};

