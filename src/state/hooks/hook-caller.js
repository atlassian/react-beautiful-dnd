// @flow
import memoizeOne from 'memoize-one';
import type { Hooks, HookCaller } from './hooks-types';
import type {
  Announce,
  State,
  DragState,
  DragStart,
  DropResult,
  DraggableId,
  DroppableId,
  TypeId,
  DraggableLocation,
  DraggableDescriptor,
  DroppableDimension,
} from '../../types';

// const announce: Announce = (message: string) =>
//   console.log(`%c ${message}`, 'color: green; font-size: 20px;');

// type State = {|
//   hasMovedFromStartLocation: boolean,
// |}

export default (announce: Announce): HookCaller => {
  const getMemoizedDragStart = memoizeOne((
    draggableId: DraggableId,
    droppableId: DroppableId,
    type: TypeId,
    index: number,
  ): DragStart => {
    const source: DraggableLocation = {
      index,
      droppableId,
    };

    const start: DragStart = {
      draggableId,
      type,
      source,
    };

    return start;
  });

  const getMemoizeDragResult = memoizeOne((): DropResult => {

  });

  const getDragStart = (state: State): ?DragStart => {
    if (!state.drag) {
      return null;
    }

    const descriptor: DraggableDescriptor = state.drag.initial.descriptor;
    const home: ?DroppableDimension = state.dimension.droppable[descriptor.droppableId];

    if (!home) {
      return null;
    }

    return getMemoizedDragStart(
      descriptor.id,
      descriptor.droppableId,
      home.descriptor.type,
      descriptor.index,
    );
  };

  const onStateChange = (hooks: Hooks, previous: State, current: State): void => {
    const { onDragStart, onDragUpdate, onDragEnd } = hooks;
    const currentPhase = current.phase;
    const previousPhase = previous.phase;

    // Dragging in progress
    if (currentPhase === 'DRAGGING' && previousPhase === 'DRAGGING') {
      // only call the onDragUpdate hook if something has changed from last time
      if (!onDragUpdate) {
        return;
      }

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

      onDragUpdate(result, announce);
      return;
    }

    // From this point we only care about phase changes

    if (currentPhase === previousPhase) {
      return;
    }

    // Drag start
    if (currentPhase === 'DRAGGING' && previousPhase !== 'DRAGGING') {
      // onDragStart is optional
      if (!onDragStart) {
        return;
      }

      const start: ?DragStart = getDragStart(current);

      if (!start) {
        console.error('Unable to publish onDragStart');
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
}
