// @flow
import invariant from 'tiny-invariant';
import messagePreset from './util/message-preset';
import type {
  Store,
  State,
  DropResult,
  Action,
  Hooks,
  Critical,
  DraggableLocation,
  DragStart,
  Announce,
} from '../../types';

const execute = (
  hook: ?AnyHookFn,
  data: AnyHookData,
  defaultMessage: string,
) => {

};

export default (getHooks: () => Hooks, announce: Announce) => {
  const publisher = (() => {
    let isDragStartPublished: boolean = false;
    let publishedStart: ?DragStart = null;
    let lastDestination: ?DraggableLocation = null;

    const start = (initial: DragStart) => {
      invariant(!isDragStartPublished, 'Cannot fire onDragStart as a drag start has already been published');
      isDragStartPublished = true;
      lastDestination = initial.source;
      publishedStart = initial;
      execute(getHooks().onDragStart, initial, messagePreset.onDragStart(initial));
    };

    const move = () => {

    };

    const end = (result: DropResult) => {
      invariant(isDragStartPublished, 'Cannot fire onDragEnd when there is no matching onDragStart');
      isDragStartPublished = false;
      lastDestination = null;
      execute(getHooks().onDragEnd, result, messagePreset.onDragEnd(result));
    };

    const cancel = () => {
      invariant(isDragStartPublished && publishedStart, 'Cannot cancel when onDragStart not fired');

      const result: DropResult = {
        draggableId: publishedStart.draggableId,
        type: publishedStart.type,
        source: publishedStart.source,
        destination: null,
        reason: 'CANCEL',
      };

      end(result);
    };

    return {
      start,
      move,
      end,
      cancel,
      isDragStartPublished: () => isDragStartPublished,
    };
  })();

  return (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    if (action.type === 'INITIAL_PUBLISH') {
      const critical: Critical = action.payload.critical;
      const source: DraggableLocation = {
        index: critical.draggable.index,
        droppableId: critical.droppable.id,
      };
      const start: DragStart = {
        draggableId: critical.draggable.id,
        type: critical.droppable.type,
        source,
      };
      publisher.start(start);
      next(action);
      return;
    }

    // Drag end
    if (action.type === 'DROP_COMPLETE') {
      const result: DropResult = action.payload;
      publisher.end(result);
      next(action);
      return;
    }

    // Drag state resetting - need to check if
    // we should fire a onDragEnd hook
    if (action.type === 'CLEAN') {
      // Unmatched drag start call - need to cancel
      if (publisher.isDragStartPublished) {
        publisher.cancel();
      }

      next(action);
      return;
    }

    // ## Perform drag updates

    // No drag updates required
    if (!publisher.isDragStartPublished) {
      next(action);
      return;
    }

    // Calling next() first so that we reduce the impact of the action
    next(action);

    if()

    const state: State = store.getState();
    invariant(state.phase === 'IDLE' || state.phase ===
      `drag start should be published in phase ${state.phase}`);
  };
};
