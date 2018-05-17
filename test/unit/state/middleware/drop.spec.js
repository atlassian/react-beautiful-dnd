// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import middleware from '../../../../src/state/middleware/drop';
import createStore from './util/create-store';
import { add, patch } from '../../../../src/state/position';
import { getPreset, makeScrollable, getInitialImpact } from '../../../utils/dimension';
import {
  clean,
  drop,
  prepare,
  initialPublish,
  bulkReplace,
  animateDrop,
  dropPending,
  move,
  completeDrop,
  updateDroppableScroll,
  type InitialPublishArgs,
  type BulkReplaceArgs,
  type DropAnimateAction,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  initialBulkReplaceArgs,
  getDragStart,
  getHomeLocation,
} from './util/preset-action-args';
import noImpact, { noMovement } from '../../../../src/state/no-impact';
import { vertical } from '../../../../src/state/axis';
import type {
  Store,
  State,
  DropResult,
  PendingDrop,
  DraggableLocation,
  DropReason,
  DroppableDimension,
  Axis,
} from '../../../../src/types';

const axis: Axis = vertical;
const preset = getPreset(vertical);

it('should throw an error if a drop action occurs while not in a phase where you can drop', () => {
  const store: Store = createStore(middleware);

  // idle
  expect(() => {
    store.dispatch(drop({ reason: 'DROP' }));
  }).toThrow();

  // prepare
  expect(() => {
    store.dispatch(prepare());
    store.dispatch(drop({ reason: 'DROP' }));
  }).toThrow();

  // drop animating
  store.dispatch(clean());
  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  // moving a little bit so that a drop animation will be needed
  store.dispatch(move({
    client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
    shouldAnimate: true,
  }));

  store.dispatch(drop({ reason: 'DROP' }));
  expect(store.getState().phase).toBe('DROP_ANIMATING');

  expect(() => store.dispatch(drop({ reason: 'DROP' }))).toThrow();
});

it('should dispatch a DROP_PENDING action if BULK_COLLECTING', () => {
  const mock = jest.fn();
  const passThrough = () => next => (action) => {
    mock(action);
    next(action);
  };
  const store: Store = createStore(
    passThrough,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  // now in the bulk collecting phase
  expect(store.getState().phase).toBe('BULK_COLLECTING');
  mock.mockReset();

  // drop
  store.dispatch(drop({ reason: 'DROP' }));

  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledWith(dropPending({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledTimes(2);
  expect(store.getState().phase).toBe('DROP_PENDING');
});

it('should not do anything if a drop action is fired and there is DROP_PENDING and it is waiting for a publish', () => {
  const mock = jest.fn();
  const passThrough = () => next => (action) => {
    mock(action);
    next(action);
  };
  const store: Store = createStore(
    passThrough,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  // now in the bulk collecting phase
  expect(store.getState().phase).toBe('BULK_COLLECTING');
  mock.mockReset();

  // drop moving to drop pending
  store.dispatch(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledWith(dropPending({ reason: 'DROP' }));

  const state: State = store.getState();
  invariant(state.phase === 'DROP_PENDING', 'invalid phase');

  expect(state.isWaiting).toBe(true);

  // Drop action being fired (should not happen?)

  mock.mockReset();
  store.dispatch(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
});

describe('no drop animation required', () => {
  const reasons: DropReason[] = ['DROP', 'CANCEL'];

  reasons.forEach((reason: DropReason) => {
    describe(`with drop reason: ${reason}`, () => {
      it('should fire a complete drop action is no drop animation is required', () => {
        const mock = jest.fn();
        const passThrough = () => next => (action) => {
          mock(action);
          next(action);
        };
        const store: Store = createStore(
          passThrough,
          middleware,
        );

        store.dispatch(clean());
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
        store.dispatch(bulkReplace(initialBulkReplaceArgs));
        expect(store.getState().phase).toBe('DRAGGING');

        // no movement yet
        mock.mockReset();
        store.dispatch(drop({ reason }));

        const destination: ?DraggableLocation = (() => {
        // destination is cleared when cancelling
          if (reason === 'CANCEL') {
            return null;
          }

          return getDragStart(initialPublishArgs.critical).source;
        })();

        const result: DropResult = {
          ...getDragStart(initialPublishArgs.critical),
          destination,
          reason,
        };
        expect(mock).toHaveBeenCalledWith(drop({ reason }));
        expect(mock).toHaveBeenCalledWith(completeDrop(result));
        expect(mock).toHaveBeenCalledWith(clean());
        expect(mock).toHaveBeenCalledTimes(3);

        // reset to initial phase
        expect(store.getState().phase).toBe('IDLE');
      });
    });
  });
});

describe('drop animation required', () => {
  const withPassThrough = (myMiddleware: mixed, mock: Function): Store => {
    const passThrough = () => next => (action) => {
      mock(action);
      next(action);
    };
    const store: Store = createStore(
      passThrough,
      myMiddleware,
    );
    return store;
  };

  describe('reason: CANCEL', () => {
    it('should animate back to the origin', () => {
      const mock = jest.fn();
      const store: Store = withPassThrough(middleware, mock);

      store.dispatch(clean());
      store.dispatch(prepare());
      store.dispatch(initialPublish(initialPublishArgs));
      store.dispatch(bulkReplace(initialBulkReplaceArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // moving a little bit so that a drop animation will be needed
      store.dispatch(move({
        client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
        shouldAnimate: true,
      }));

      mock.mockReset();
      store.dispatch(drop({ reason: 'CANCEL' }));

      const pending: PendingDrop = {
        newHomeOffset: { x: 0, y: 0 },
        impact: noImpact,
        result: {
          ...getDragStart(initialPublishArgs.critical),
          // destination cleared
          destination: null,
          reason: 'CANCEL',
        },
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason: 'CANCEL' }));
      expect(mock).toHaveBeenCalledWith(animateDrop(pending));
      expect(mock).toHaveBeenCalledTimes(2);
      expect(store.getState().phase).toBe('DROP_ANIMATING');
    });

    it('should account for any change in scroll in the home droppable', () => {
      const mock = jest.fn();
      const store: Store = withPassThrough(middleware, mock);

      const scrollableHome: DroppableDimension = makeScrollable(preset.home);

      const customArgs: InitialPublishArgs = {
        ...initialPublishArgs,
        dimensions: {
          ...initialPublishArgs.dimensions,
          droppables: {
            [scrollableHome.descriptor.id]: scrollableHome,
          },
        },
      };

      // getting into a drag
      store.dispatch(clean());
      store.dispatch(prepare());
      store.dispatch(initialPublish(customArgs));
      store.dispatch(bulkReplace(initialBulkReplaceArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // doing a small scroll
      store.dispatch(updateDroppableScroll({
        id: customArgs.critical.droppable.id,
        offset: { x: 1, y: 1 },
      }));

      // dropping
      mock.mockReset();
      store.dispatch(drop({ reason: 'CANCEL' }));
      const pending: PendingDrop = {
        // what we need to do to get back to the origin
        newHomeOffset: { x: -1, y: -1 },
        impact: {
          movement: noMovement,
          direction: null,
          destination: null,
        },
        result: {
          ...getDragStart(customArgs.critical),
          destination: null,
          reason: 'CANCEL',
        },
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason: 'CANCEL' }));
      expect(mock).toHaveBeenCalledWith(animateDrop(pending));
      expect(mock).toHaveBeenCalledTimes(2);
    });

    it('should not account for scrolling in the droppable the draggable is over if it is not the home', () => {
      const mock = jest.fn();
      const store: Store = withPassThrough(middleware, mock);

      const scrollableForeign: DroppableDimension = makeScrollable(preset.foreign);
      const customReplace: BulkReplaceArgs = {
        ...initialBulkReplaceArgs,
        dimensions: {
          ...initialBulkReplaceArgs.dimensions,
          droppables: {
            ...initialBulkReplaceArgs.dimensions.droppables,
            [scrollableForeign.descriptor.id]: scrollableForeign,
          },
        },
      };

      // getting into a drag
      store.dispatch(clean());
      store.dispatch(prepare());
      store.dispatch(initialPublish(initialPublishArgs));
      store.dispatch(bulkReplace(customReplace));
      expect(store.getState().phase).toBe('DRAGGING');

      // moving over the foreign droppable
      store.dispatch(move({
        client: scrollableForeign.client.borderBox.center,
        shouldAnimate: false,
      }));
      const state: State = store.getState();
      invariant(state.phase === 'DRAGGING', 'Invalid phase');
      invariant(state.impact.destination, 'Expected to be over foreign droppable');
      expect(state.impact.destination.droppableId).toBe(scrollableForeign.descriptor.id);

      // doing a small scroll on foreign
      store.dispatch(updateDroppableScroll({
        id: scrollableForeign.descriptor.id,
        offset: { x: 1, y: 1 },
      }));

      // dropping
      mock.mockReset();
      store.dispatch(drop({ reason: 'CANCEL' }));
      expect(mock).toHaveBeenCalledWith(drop({ reason: 'CANCEL' }));
      // Just checking the offset rather than the whole shape
      // Expecting return to origin as the scroll has not changed
      const action: DropAnimateAction = (mock.mock.calls[1][0] : any);
      expect(action.type).toEqual('DROP_ANIMATE');
      expect(action.payload.newHomeOffset).toEqual({ x: 0, y: 0 });
      expect(mock).toHaveBeenCalledTimes(2);
    });
  });

  describe('reason: DROP', () => {
    it('should account for any change in scroll in the home droppable if not dragging over anything', () => {
      const mock = jest.fn();
      const store: Store = withPassThrough(middleware, mock);

      const scrollableHome: DroppableDimension = makeScrollable(preset.home);
      const customArgs: InitialPublishArgs = {
        ...initialPublishArgs,
        dimensions: {
          ...initialPublishArgs.dimensions,
          droppables: {
            [scrollableHome.descriptor.id]: scrollableHome,
          },
        },
      };

      // getting into a drag
      store.dispatch(prepare());
      store.dispatch(initialPublish(customArgs));
      store.dispatch(bulkReplace(initialBulkReplaceArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // move after the end of the home droppable
      store.dispatch(move({
        client: {
          x: preset.home.client.marginBox.center.x,
          y: preset.home.client.marginBox.bottom + 1,
        },
        shouldAnimate: false,
      }));

      // assert we are not over the home droppable
      const state: State = store.getState();
      invariant(state.phase === 'DRAGGING');
      invariant(!state.impact.destination, 'Should have no destination');

      // scroll the home droppable
      store.dispatch(updateDroppableScroll({
        id: customArgs.critical.droppable.id,
        offset: { x: 1, y: 1 },
      }));

      // drop
      mock.mockReset();
      store.dispatch(drop({ reason: 'DROP' }));
      const pending: PendingDrop = {
        // what we need to do to get back to the origin
        newHomeOffset: { x: -1, y: -1 },
        impact: {
          movement: noMovement,
          direction: null,
          destination: null,
        },
        result: {
          ...getDragStart(customArgs.critical),
          destination: null,
          reason: 'DROP',
        },
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
      expect(mock).toHaveBeenCalledWith(animateDrop(pending));
      expect(mock).toHaveBeenCalledTimes(2);
    });

    // Could also add a test to check this is true for foreign droppables - but it has proven
    // very difficult to setup that test correctly
    it('should account for any change in scroll in the droppable being dropped into', () => {
      const mock = jest.fn();
      const store: Store = withPassThrough(middleware, mock);

      const scrollableHome: DroppableDimension = makeScrollable(preset.home);
      const customArgs: InitialPublishArgs = {
        ...initialPublishArgs,
        dimensions: {
          ...initialPublishArgs.dimensions,
          droppables: {
            [scrollableHome.descriptor.id]: scrollableHome,
          },
        },
      };

      // getting into a drag
      store.dispatch(prepare());
      store.dispatch(initialPublish(customArgs));
      store.dispatch(bulkReplace(initialBulkReplaceArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // moving to the top of the foreign droppable
      store.dispatch(move({
        client: { x: 1, y: 1 },
        shouldAnimate: false,
      }));
      const state: State = store.getState();
      invariant(state.phase === 'DRAGGING', 'Invalid phase');
      invariant(state.impact.destination, 'Expected to be over home droppable');
      expect(state.impact.destination.droppableId).toBe(scrollableHome.descriptor.id);

      // scroll the foreign droppable
      store.dispatch(updateDroppableScroll({
        id: scrollableHome.descriptor.id,
        offset: { x: 1, y: 1 },
      }));

      // drop
      mock.mockReset();
      store.dispatch(drop({ reason: 'DROP' }));
      const pending: PendingDrop = {
        // what we need to do to get back to the origin
        newHomeOffset: { x: -1, y: -1 },
        impact: {
          movement: {
            displaced: [],
            amount: patch(axis.line, preset.inHome1.client.marginBox[axis.size]),
            isBeyondStartPosition: false,
          },
          direction: preset.home.axis.direction,
          destination: getHomeLocation(customArgs.critical),
        },
        result: {
          ...getDragStart(customArgs.critical),
          destination: getHomeLocation(customArgs.critical),
          reason: 'DROP',
        },
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
      expect(mock).toHaveBeenCalledWith(animateDrop(pending));
      expect(mock).toHaveBeenCalledTimes(2);
    });

    it('should account for any change in scroll in the window', () => {
      // getting into a drag

      // scroll the window

      // drop
    });
  });
});
