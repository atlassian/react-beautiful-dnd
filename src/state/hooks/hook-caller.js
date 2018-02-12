// @flow
import messagePreset from './message-preset';
import type { HookCaller } from './hooks-types';
import type {
  Announce,
  Hooks,
  HookProvided,
  State as AppState,
  DragState,
  DragStart,
  DragUpdate,
  DropResult,
  DraggableLocation,
  DraggableDescriptor,
  DroppableDimension,
} from '../../types';

type State = {
  isDragging: boolean,
  start: ?DraggableLocation,
  lastDestination: ?DraggableLocation,
  hasMovedFromStartLocation: boolean,
}

const notDragging: State = {
  isDragging: false,
  start: null,
  lastDestination: null,
  hasMovedFromStartLocation: false,
};

const areLocationsEqual = (current: ?DraggableLocation, next: ?DraggableLocation) => {
  // if both are null - we are equal
  if (current == null && next == null) {
    return true;
  }

  // if one is null - then they are not equal
  if (current == null || next == null) {
    return false;
  }

  // compare their actual values
  return current.droppableId === next.droppableId &&
    current.index === next.index;
};

const getAnnouncerForConsumer = (announce: Announce) => {
  let wasCalled: boolean = false;
  let isExpired: boolean = false;

  // not allowing async announcements
  setTimeout(() => {
    isExpired = true;
  });

  const result = (message: string): void => {
    if (wasCalled) {
      console.warn('Announcement already made. Not making a second announcement');
      return;
    }

    if (isExpired) {
      console.warn(`
        Announcements cannot be made asynchronously.
        Default message has already been announced.
      `);
      return;
    }

    wasCalled = true;
    announce(message);
  };

  // getter for isExpired
  result.wasCalled = (): boolean => wasCalled;

  return result;
};

type OnDragUpdate = (update: DragUpdate, provided: HookProvided) => void;

export default (announce: Announce): HookCaller => {
  let state: State = notDragging;

  const setState = (partial: Object): void => {
    const newState: State = {
      ...state,
      ...partial,
    };
    state = newState;
  };

  const getDragStart = (appState: AppState): ?DragStart => {
    if (!appState.drag) {
      return null;
    }

    const descriptor: DraggableDescriptor = appState.drag.initial.descriptor;
    const home: ?DroppableDimension = appState.dimension.droppable[descriptor.droppableId];

    if (!home) {
      return null;
    }

    const source: DraggableLocation = {
      index: descriptor.index,
      droppableId: descriptor.droppableId,
    };

    const start: DragStart = {
      draggableId: descriptor.id,
      type: home.descriptor.type,
      source,
    };

    return start;
  };

  const onDrag = (() => {
    const announceMessage = (update: DragUpdate, onDragUpdate: ?OnDragUpdate) => {
      if (!onDragUpdate) {
        announce(messagePreset.onDragUpdate(update));
        return;
      }

      const provided: HookProvided = {
        announce: getAnnouncerForConsumer(announce),
      };
      onDragUpdate(update, provided);

      // if they do not announce - use the default
      if (!provided.announce.wasCalled()) {
        announce(messagePreset.onDragUpdate(update));
      }
    };

    return (current: AppState, onDragUpdate?: OnDragUpdate) => {
      if (!state.isDragging) {
        console.error('Cannot process dragging update if drag has not started');
        return;
      }

      const drag: ?DragState = current.drag;
      const start: ?DragStart = getDragStart(current);
      if (!start || !drag) {
        console.error('Cannot update drag when there is invalid state');
        return;
      }

      const destination: ?DraggableLocation = drag.impact.destination;
      const update: DragUpdate = {
        draggableId: start.draggableId,
        type: start.type,
        source: start.source,
        destination,
      };

      if (!state.hasMovedFromStartLocation) {
        // has not moved past the home yet
        if (areLocationsEqual(start.source, destination)) {
          return;
        }

        // We have now moved past the home location
        setState({
          lastDestination: destination,
          hasMovedFromStartLocation: true,
        });

        announceMessage(update, onDragUpdate);
        return;
      }

      // has not moved from the previous location
      if (areLocationsEqual(state.lastDestination, destination)) {
        return;
      }

      setState({
        lastDestination: destination,
      });

      announceMessage(update, onDragUpdate);
    };
  })();

  const onStateChange = (hooks: Hooks, previous: AppState, current: AppState): void => {
    const { onDragStart, onDragUpdate, onDragEnd } = hooks;
    const currentPhase = current.phase;
    const previousPhase = previous.phase;

    // Dragging in progress
    if (currentPhase === 'DRAGGING' && previousPhase === 'DRAGGING') {
      onDrag(current, onDragUpdate);
      return;
    }

    // We are not in the dragging phase so we can clear this state
    if (state.isDragging) {
      setState(notDragging);
    }

    // From this point we only care about phase changes

    if (currentPhase === previousPhase) {
      return;
    }

    // Drag start
    if (currentPhase === 'DRAGGING' && previousPhase !== 'DRAGGING') {
      const start: ?DragStart = getDragStart(current);

      if (!start) {
        console.error('Unable to publish onDragStart');
        return;
      }

      setState({
        isDragging: true,
        hasMovedFromStartLocation: false,
        start,
      });

      // onDragStart is optional
      if (!onDragStart) {
        announce(messagePreset.onDragStart(start));
        return;
      }

      const provided: HookProvided = {
        announce: getAnnouncerForConsumer(announce),
      };
      onDragStart(start, provided);

      // if they did not announce anything - use the default
      if (!provided.announce.wasCalled()) {
        announce(messagePreset.onDragStart(start));
      }
      return;
    }

    // Drag end
    if (currentPhase === 'DROP_COMPLETE' && previousPhase !== 'DROP_COMPLETE') {
      if (!current.drop || !current.drop.result) {
        console.error('cannot fire onDragEnd hook without drag state', { current, previous });
        return;
      }
      const result: DropResult = current.drop.result;

      const provided: HookProvided = {
        announce: getAnnouncerForConsumer(announce),
      };
      onDragEnd(result, provided);

      if (!provided.announce.wasCalled()) {
        announce(messagePreset.onDragEnd(result));
      }
      return;
    }

    // Drag ended while dragging
    if (currentPhase === 'IDLE' && previousPhase === 'DRAGGING') {
      if (!previous.drag) {
        console.error('cannot fire onDragEnd for cancel because cannot find previous drag');
        return;
      }

      const descriptor: DraggableDescriptor = previous.drag.initial.descriptor;
      const home: ?DroppableDimension = previous.dimension.droppable[descriptor.droppableId];

      if (!home) {
        console.error('cannot find dimension for home droppable');
        return;
      }

      const source: DraggableLocation = {
        index: descriptor.index,
        droppableId: descriptor.droppableId,
      };
      const result: DropResult = {
        draggableId: descriptor.id,
        type: home.descriptor.type,
        source,
        destination: null,
        reason: 'CANCEL',
      };

      const provided: HookProvided = {
        announce: getAnnouncerForConsumer(announce),
      };
      onDragEnd(result, provided);

      if (!provided.announce.wasCalled()) {
        announce(messagePreset.onDragEnd(result));
      }

      return;
    }

    // Drag ended during a drop animation. Not super sure how this can even happen.
    // This is being really safe
    if (currentPhase === 'IDLE' && previousPhase === 'DROP_ANIMATING') {
      if (!previous.drop || !previous.drop.pending) {
        console.error('cannot fire onDragEnd for cancel because cannot find previous pending drop');
        return;
      }

      const result: DropResult = {
        draggableId: previous.drop.pending.result.draggableId,
        type: previous.drop.pending.result.type,
        source: previous.drop.pending.result.source,
        destination: null,
        reason: 'CANCEL',
      };

      const provided: HookProvided = {
        announce: getAnnouncerForConsumer(announce),
      };
      onDragEnd(result, provided);

      if (!provided.announce.wasCalled()) {
        announce(messagePreset.onDragEnd(result));
      }
    }
  };

  const caller: HookCaller = {
    onStateChange,
  };

  return caller;
};

