// @flow
import createStore from '../../../src/state/create-store';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import createHookCaller from '../../../src/state/hooks/hook-caller';
import type { HookCaller } from '../../../src/state/hooks/hooks-types';
import { getPreset } from '../../utils/dimension';
import { add } from '../../../src/state/position';
import {
  lift,
  clean,
  publishDraggableDimension,
  publishDroppableDimension,
  bulkPublishDimensions,
  updateDroppableDimensionScroll,
  moveForward,
  drop,
  move,
  updateDroppableDimensionIsEnabled,
} from '../../../src/state/action-creators';
import type { DimensionMarshal, Callbacks as DimensionMarshalCallbacks } from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  State,
  Store,
  DraggableDimension,
  DroppableDimension,
  Position,
  DroppableId,
  InitialDragPositions,
  Hooks,
} from '../../../src/types';

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };

const getDimensionMarshal = (store: Store): DimensionMarshal => {
  const callbacks: DimensionMarshalCallbacks = {
    cancel: () => {
      store.dispatch(clean());
    },
    publishDraggable: (dimension: DraggableDimension) => {
      store.dispatch(publishDraggableDimension(dimension));
    },
    publishDroppable: (dimension: DroppableDimension) => {
      store.dispatch(publishDroppableDimension(dimension));
    },
    bulkPublish: (droppables: DroppableDimension[], draggables: DraggableDimension[]) => {
      store.dispatch(bulkPublishDimensions(droppables, draggables));
    },
    updateDroppableScroll: (id: DroppableId, offset: Position) => {
      store.dispatch(updateDroppableDimensionScroll(id, offset));
    },
    updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => {
      store.dispatch(updateDroppableDimensionIsEnabled(id, isEnabled));
    },
  };
  const dimensionMarshal: DimensionMarshal = createDimensionMarshal(callbacks);
  return dimensionMarshal;
};

describe('lifting and the dimension marshal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('flushing an animating drop', () => {
    describe('moving in the same list', () => {
      it('should have the correct indexes in the descriptor post lift', () => {
        const store: Store = createStore();
        const dimensionMarshal: DimensionMarshal = getDimensionMarshal(store);
        const caller: HookCaller = createHookCaller(() => { });

        // register home dimensions
        dimensionMarshal.registerDroppable(preset.home.descriptor, {
          getDimension: () => preset.home,
          watchScroll: () => { },
          unwatchScroll: () => { },
          scroll: () => { },
        });
        preset.inHomeList.forEach((dimension: DraggableDimension) => {
          dimensionMarshal.registerDraggable(dimension.descriptor, () => dimension);
        });

        // reorder hooks
        const hooks: Hooks = {
          onDragEnd: () => {
            // cheating as we know the result

            // unregistering draggables

            dimensionMarshal.unregisterDraggable(preset.inHome1.descriptor);
            dimensionMarshal.unregisterDraggable(preset.inHome2.descriptor);

            // registering updated draggables

            // $ExpectError - using spread
            const postDragInHome1: DraggableDimension = {
              ...preset.inHome1,
              descriptor: {
                ...preset.inHome1.descriptor,
                // moving forward
                index: 1,
              },
            };
            // $ExpectError - using spread
            const postDragInHome2: DraggableDimension = {
              ...preset.inHome2,
              descriptor: {
                ...preset.inHome2.descriptor,
                // moving backward
                index: 0,
              },
            };

            dimensionMarshal.registerDraggable(postDragInHome1.descriptor, () => postDragInHome1);
            dimensionMarshal.registerDraggable(postDragInHome2.descriptor, () => postDragInHome2);
          },
        };

        // setup dimension marshal subscription
        let previous: State = store.getState();
        store.subscribe(() => {
          const current: State = store.getState();
          const previousValue = previous;
          previous = current;

          if (current.phase === previousValue.phase) {
            return;
          }

          caller(hooks, previousValue, current);
          dimensionMarshal.onPhaseChange(current);
        });

        // perform a drag - moving inHome1 from index 0 to index 1
        const initial: InitialDragPositions = {
          selection: preset.inHome1.client.withoutMargin.center,
          center: preset.inHome1.client.withoutMargin.center,
        };
        lift(
          preset.inHome1.descriptor.id,
          initial,
          preset.windowScroll,
          'JUMP',
        )(store.dispatch, store.getState);

        // drag should be started after flushing all timers
        jest.runAllTimers();
        requestAnimationFrame.flush();

        // checking drag has started
        expect(store.getState().phase).toBe('DRAGGING');
        // $ExpectError - not checking for null
        expect(store.getState().drag.initial.descriptor).toEqual(preset.inHome1.descriptor);

        // perform a move that moves inHome1 into the second position
        store.dispatch(moveForward(preset.inHome1.descriptor.id));

        // move slightly so that we are not exactly over the drop location
        // if we are exactly over the drop location there will be no drop animation
        // $ExpectError - not checking for null
        const center: Position = store.getState().drag.current.client.center;
        const shifted: Position = add(center, { x: 1, y: 1 });
        store.dispatch(
          move(preset.inHome1.descriptor.id, shifted, preset.windowScroll)
        );

        // will start a drop animation
        drop()(store.dispatch, store.getState);

        // should be about to drop into the second position
        expect(store.getState().phase).toBe('DROP_ANIMATING');
        // $ExpectError - not checking for null
        expect(store.getState().drop.pending.result.destination).toEqual({
          droppableId: preset.home.descriptor.id,
          index: 1,
        });
        // internal dimension state not updated at this point
        expect(
          store.getState().dimension.draggable[preset.inHome1.descriptor.id].descriptor.index
        ).toBe(0);
        expect(
          store.getState().dimension.draggable[preset.inHome2.descriptor.id].descriptor.index
        ).toBe(1);

        // before drop animation is finished we start another drag
        const forSecondDrag: InitialDragPositions = {
          selection: preset.inHome3.client.withoutMargin.center,
          center: preset.inHome3.client.withoutMargin.center,
        };
        lift(
          preset.inHome3.descriptor.id,
          forSecondDrag,
          origin,
          'JUMP',
        )(store.dispatch, store.getState);

        // drag should be started after flushing all timers and all state will be published
        jest.runAllTimers();
        requestAnimationFrame.flush();

        // descriptors in store reflect droppable values even though drop was flushed
        expect(
          store.getState().dimension.draggable[preset.inHome1.descriptor.id].descriptor.index
        ).toBe(1);
        expect(
          store.getState().dimension.draggable[preset.inHome2.descriptor.id].descriptor.index
        ).toBe(0);
      });
    });
  });
});
