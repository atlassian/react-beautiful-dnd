// @flow
import type {
  State,
  Hooks,
  DragStart,
  DropResult,
} from '../types';

export default (hooks: Hooks, current: State, previous: State): void => {
  const { onLiftStart, onLiftEnd, onDragStart, onDragEnd } = hooks;
  const currentPhase = current.phase;
  const previousPhase = previous.phase;

  // Exit early if phase in unchanged
  if (currentPhase === previousPhase) {
    return;
  }

  // Lift start
  if (currentPhase === 'BEGIN_LIFT' && previousPhase !== 'BEGIN_LIFT') {
    // onLiftStart is optional
    if (!onLiftStart) {
      return;
    }

    onLiftStart();
    return;
  }

  // Lift end
  if (currentPhase === 'COMPLETE_LIFT' && previousPhase !== 'COMPLETE_LIFT') {
    // onLiftEnd is optional
    if (!onLiftEnd) {
      return;
    }

    onLiftEnd();
    return;
  }

  // Drag start
  if (currentPhase === 'DRAGGING' && previousPhase !== 'DRAGGING') {
    // onDragStart is optional
    if (!onDragStart) {
      return;
    }

    if (!current.drag) {
      console.error('cannot fire onDragStart hook without drag state', { current, previous });
      return;
    }

    const start: DragStart = {
      draggableId: current.drag.current.id,
      type: current.drag.current.type,
      source: current.drag.initial.source,
    };

    onDragStart(start);
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
      onDragEnd(current.drop.result);
      return;
    }

    // Do not publish a result.destination where nothing moved
    const didMove: boolean = source.droppableId !== destination.droppableId ||
                              source.index !== destination.index;

    if (didMove) {
      onDragEnd(current.drop.result);
      return;
    }

    const muted: DropResult = {
      draggableId,
      type,
      source,
      destination: null,
    };

    onDragEnd(muted);
  }

  // Drag ended while dragging
  if (currentPhase === 'IDLE' && previousPhase === 'DRAGGING') {
    if (!previous.drag) {
      console.error('cannot fire onDragEnd for cancel because cannot find previous drag');
      return;
    }
    const result: DropResult = {
      draggableId: previous.drag.current.id,
      type: previous.drag.current.type,
      source: previous.drag.initial.source,
      destination: null,
    };
    onDragEnd(result);
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
    onDragEnd(result);
  }
};
