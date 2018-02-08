// @flow
import type { Hooks, HookCaller } from './hooks-types';
import type {
  Announce,
  State as AppState,
  DragState,
  DragStart,
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

const initial: State = {
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

export default (announce: Announce): HookCaller => {
  let state: State = initial;

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

  const onStateChange = (hooks: Hooks, previous: AppState, current: AppState): void => {
    const { onDragStart, onDragUpdate, onDragEnd } = hooks;
    const currentPhase = current.phase;
    const previousPhase = previous.phase;

    // Dragging in progress
    if (currentPhase === 'DRAGGING' && previousPhase === 'DRAGGING') {
      // only call the onDragUpdate hook if something has changed from last time

      const start: ?DragStart = getDragStart(current);

      if (!start) {
        console.error('Cannot update drag when there is invalid state');
        return;
      }

      const drag: ?DragState = current.drag;

      if (!drag) {
        console.error('Cannot update drag when there is invalid state');
        return;
      }

      const destination: ?DraggableLocation = drag.impact.destination;

      const result: DropResult = {
        draggableId: start.draggableId,
        type: start.type,
        source: start.source,
        destination,
      };

      // has not left the home position
      if (!state.hasMovedFromStartLocation) {
        // has not moved past the home yet
        if (areLocationsEqual(start.source, destination)) {
          return;
        }

        setState({
          lastDestination: destination,
          hasMovedFromStartLocation: true,
        });

        if (onDragUpdate) {
          onDragUpdate(result, announce);
        }
        return;
      }

      // has not moved from the previous location
      if (areLocationsEqual(state.lastDestination, destination)) {
        return;
      }

      setState({
        lastDestination: destination,
      });

      if (onDragUpdate) {
        onDragUpdate(result, announce);
      }
      return;
    }

    // We are not in the dragging phase so we can clear this state
    if (state.isDragging) {
      setState(initial);
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
        return;
      }

      onDragStart(start, announce);
      return;
    }

    // Drag end
    if (currentPhase === 'DROP_COMPLETE' && previousPhase !== 'DROP_COMPLETE') {
      if (!current.drop || !current.drop.result) {
        console.error('cannot fire onDragEnd hook without drag state', { current, previous });
        return;
      }

      const {
        source,
        destination,
        draggableId,
        type,
      } = current.drop.result;

      // Could be a cancel or a drop nowhere
      if (!destination) {
        onDragEnd(current.drop.result, announce);
        return;
      }

      // Do not publish a result.destination where nothing moved
      const didMove: boolean = source.droppableId !== destination.droppableId ||
        source.index !== destination.index;

      if (didMove) {
        onDragEnd(current.drop.result, announce);
        return;
      }

      const muted: DropResult = {
        draggableId,
        type,
        source,
        destination: null,
      };

      onDragEnd(muted, announce);
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
      };
      onDragEnd(result, announce);
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
      };
      onDragEnd(result, announce);
    }
  };

  const caller: HookCaller = {
    onStateChange,
  };

  return caller;
};

