// @flow
import invariant from 'tiny-invariant';
import messagePreset from './util/message-preset';
import * as timings from '../../debug/timings';
import type {
  State,
  DropResult,
  Hooks,
  HookProvided,
  Critical,
  DraggableLocation,
  DragStart,
  Announce,
  DragUpdate,
  OnDragStartHook,
  OnDragUpdateHook,
  OnDragEndHook,
} from '../../types';
import type {
  Action,
  Middleware,
  MiddlewareStore,
  Dispatch,
} from '../store-types';

type AnyHookFn = OnDragStartHook | OnDragUpdateHook | OnDragEndHook;
type AnyHookData = DragStart | DragUpdate | DropResult;

const withTimings = (key: string, fn: Function) => {
  timings.start(key);
  fn();
  timings.finish(key);
};

const areLocationsEqual = (
  first: ?DraggableLocation,
  second: ?DraggableLocation,
): boolean => {
  // if both are null - we are equal
  if (first == null && second == null) {
    return true;
  }

  // if one is null - then they are not equal
  if (first == null || second == null) {
    return false;
  }

  // compare their actual values
  return (
    first.droppableId === second.droppableId && first.index === second.index
  );
};

const isCriticalEqual = (first: Critical, second: Critical): boolean => {
  if (first === second) {
    return true;
  }

  const isDraggableEqual: boolean =
    first.draggable.id === second.draggable.id &&
    first.draggable.droppableId === second.draggable.droppableId &&
    first.draggable.type === second.draggable.type &&
    first.draggable.index === second.draggable.index;

  const isDroppableEqual: boolean =
    first.droppable.id === second.droppable.id &&
    first.droppable.type === second.droppable.type;

  return isDraggableEqual && isDroppableEqual;
};

const getExpiringAnnounce = (announce: Announce) => {
  let wasCalled: boolean = false;
  let isExpired: boolean = false;

  // not allowing async announcements
  setTimeout(() => {
    isExpired = true;
  });

  const result = (message: string): void => {
    if (wasCalled) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Announcement already made. Not making a second announcement',
        );
      }

      return;
    }

    if (isExpired) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`
          Announcements cannot be made asynchronously.
          Default message has already been announced.
        `);
      }
      return;
    }

    wasCalled = true;
    announce(message);
  };

  // getter for isExpired
  // using this technique so that a consumer cannot
  // set the isExpired or wasCalled flags
  result.wasCalled = (): boolean => wasCalled;

  return result;
};

const getDragStart = (critical: Critical): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: {
    droppableId: critical.droppable.id,
    index: critical.draggable.index,
  },
});

export default (getHooks: () => Hooks, announce: Announce): Middleware => {
  const execute = (
    hook: ?AnyHookFn,
    data: AnyHookData,
    getDefaultMessage: (data: any) => string,
  ) => {
    if (!hook) {
      announce(getDefaultMessage(data));
      return;
    }

    const willExpire: Announce = getExpiringAnnounce(announce);
    const provided: HookProvided = {
      announce: willExpire,
    };

    // Casting because we are not validating which data type is going into which hook
    hook((data: any), provided);

    if (!willExpire.wasCalled()) {
      announce(getDefaultMessage(data));
    }
  };

  const publisher = (() => {
    let lastLocation: ?DraggableLocation = null;
    let lastCritical: ?Critical = null;
    let isDragStartPublished: boolean = false;

    const start = (critical: Critical) => {
      invariant(
        !isDragStartPublished,
        'Cannot fire onDragStart as a drag start has already been published',
      );
      const data: DragStart = getDragStart(critical);
      isDragStartPublished = true;
      lastCritical = critical;
      lastLocation = data.source;
      withTimings('onDragStart', () =>
        execute(getHooks().onDragStart, data, messagePreset.onDragStart),
      );
    };

    // Passing in the critical location again as it can change during a drag
    const move = (critical: Critical, location: ?DraggableLocation) => {
      invariant(
        isDragStartPublished && lastCritical,
        'Cannot fire onDragMove when onDragStart has not been called',
      );

      // Has the critical changed? Will result in a source change
      const hasCriticalChanged: boolean = !isCriticalEqual(
        critical,
        lastCritical,
      );
      if (hasCriticalChanged) {
        lastCritical = critical;
      }

      // Has the location changed? Will result in a destination change
      const hasLocationChanged: boolean = !areLocationsEqual(
        lastLocation,
        location,
      );
      if (hasLocationChanged) {
        lastLocation = location;
      }

      // Nothing has changed - no update needed
      if (!hasCriticalChanged && !hasLocationChanged) {
        return;
      }

      const data: DragUpdate = {
        ...getDragStart(critical),
        destination: location,
      };

      withTimings('onDragUpdate', () =>
        execute(getHooks().onDragUpdate, data, messagePreset.onDragUpdate),
      );
    };

    const drop = (result: DropResult) => {
      invariant(
        isDragStartPublished,
        'Cannot fire onDragEnd when there is no matching onDragStart',
      );
      isDragStartPublished = false;
      lastLocation = null;
      lastCritical = null;
      withTimings('onDragEnd', () =>
        execute(getHooks().onDragEnd, result, messagePreset.onDragEnd),
      );
    };

    // A non user initiated cancel
    const abort = () => {
      invariant(
        isDragStartPublished && lastCritical,
        'Cannot cancel when onDragStart not fired',
      );

      const result: DropResult = {
        ...getDragStart(lastCritical),
        destination: null,
        reason: 'CANCEL',
      };
      drop(result);
    };

    return {
      start,
      move,
      drop,
      abort,
      isDragStartPublished: (): boolean => isDragStartPublished,
    };
  })();

  return (store: MiddlewareStore) => (next: Dispatch) => (
    action: Action,
  ): any => {
    if (action.type === 'INITIAL_PUBLISH') {
      const critical: Critical = action.payload.critical;
      // Need to fire the onDragStart hook before the connected components are rendered
      // This is so consumers can do work in their onDragStart function
      // before we have applied any inline styles to anything,
      // such as position: fixed to the dragging item.
      // This is important for use cases such as a table which uses dimension locking
      publisher.start(critical);
      next(action);
      return;
    }

    // All other hooks can fire after we have updated our connected components
    next(action);

    // Drag end
    if (action.type === 'DROP_COMPLETE') {
      const result: DropResult = action.payload;
      publisher.drop(result);
      return;
    }

    // Drag state resetting - need to check if
    // we should fire a onDragEnd hook
    if (action.type === 'CLEAN') {
      // Unmatched drag start call - need to cancel
      if (publisher.isDragStartPublished()) {
        publisher.abort();
      }

      return;
    }

    // ## Perform drag updates

    // No drag updates required
    if (!publisher.isDragStartPublished()) {
      return;
    }

    // impact of action has already been reduced

    const state: State = store.getState();
    if (state.phase === 'DRAGGING') {
      publisher.move(state.critical, state.impact.destination);
    }
  };
};
