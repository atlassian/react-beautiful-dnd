// @flow
import memoizeOne from 'memoize-one';
import type { Action, Store, State, Hooks, DropResult } from '../types';

const getFireHooks = (hooks: Hooks) => memoizeOne((current: State, previous: State): void => {
  const { onDragStart, onDragEnd } = hooks;

  const currentPhase = current.phase;
  const previousPhase = previous.phase;

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

    onDragStart(current.drag.current.id, current.drag.initial.source);
    return;
  }

  // Drag end
  if (currentPhase === 'DROP_COMPLETE' && previousPhase !== 'DROP_COMPLETE') {
    if (!current.drop || !current.drop.result) {
      console.error('cannot fire onDragEnd hook without drag state', { current, previous });
      return;
    }

    const { source, destination, draggableId } = current.drop.result;

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
      source: previous.drop.pending.result.source,
      destination: null,
    };
    onDragEnd(result);
  }
});

export default (hooks: Hooks) => {
  const fireHooks = getFireHooks(hooks);
  return (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    const previous: State = store.getState();

    const result: mixed = next(action);

    const current: State = store.getState();

    fireHooks(current, previous);

    return result;
  };
};
