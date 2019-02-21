// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import {
  animateDrop,
  clean,
  completeDrop,
  drop,
  initialPublish,
  move,
  moveDown,
  updateDroppableIsCombineEnabled,
  moveUp,
  type InitialPublishArgs,
  type AnimateDropArgs,
} from '../../../../../src/state/action-creators';
import type { Store } from '../../../../../src/state/store-types';
import middleware from '../../../../../src/state/middleware/drop';
import getDropDuration from '../../../../../src/state/middleware/drop/get-drop-duration';
import { add, origin } from '../../../../../src/state/position';
import {
  preset,
  getDragStart,
  initialPublishArgs,
  homeImpact,
  onLift,
  critical,
  getCompletedArgs,
  getDropImpactForReason,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type {
  DropResult,
  CompletedDrag,
  DraggableLocation,
  DropReason,
  DragImpact,
  State,
  Combine,
  CombineImpact,
} from '../../../../../src/types';
import noImpact from '../../../../../src/state/no-impact';
import getDropImpact from '../../../../../src/state/middleware/drop/get-drop-impact';
import getNewHomeClientOffset from '../../../../../src/state/middleware/drop/get-new-home-client-offset';

['DROP' /* , 'CANCEL' */].forEach((reason: DropReason) => {
  describe(`with drop reason: ${reason}`, () => {
    it('should fire a complete drop action is no drop animation is required', () => {
      const mock = jest.fn();
      const store: Store = createStore(passThrough(mock), middleware);

      store.dispatch(clean());
      store.dispatch(initialPublish(initialPublishArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // no movement yet
      mock.mockReset();
      store.dispatch(drop({ reason }));

      expect(mock).toHaveBeenCalledWith(drop({ reason }));
      expect(mock).toHaveBeenCalledWith(completeDrop(getCompletedArgs(reason)));
      expect(mock).toHaveBeenCalledTimes(2);

      // reset to initial phase
      expect(store.getState().phase).toBe('IDLE');
    });

    it('should fire an animate drop action if a drop animation movement is required', () => {
      const mock = jest.fn();
      const store: Store = createStore(passThrough(mock), middleware);

      store.dispatch(initialPublish(initialPublishArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // moving a little bit so that a drop animation will be needed
      const shift: Position = { x: 1, y: 1 };
      store.dispatch(
        move({
          client: add(initialPublishArgs.clientSelection, shift),
        }),
      );
      const current: State = store.getState();
      invariant(current.isDragging);
      // impact is cleared when cancelling
      const destination: ?DraggableLocation =
        reason === 'DROP' ? getDragStart().source : null;

      mock.mockReset();
      store.dispatch(drop({ reason }));

      const result: DropResult = {
        ...getDragStart(),
        destination,
        reason,
        combine: null,
      };
      const completed: CompletedDrag = {
        result,
        impact: getDropImpactForReason(reason),
        critical,
      };
      const args: AnimateDropArgs = {
        completed,
        newHomeClientOffset: origin,
        dropDuration: getDropDuration({
          current: shift,
          destination: origin,
          reason,
        }),
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason }));
      expect(mock).toHaveBeenCalledWith(animateDrop(args));
      expect(mock).toHaveBeenCalledTimes(2);
      expect(store.getState().phase).toBe('DROP_ANIMATING');
    });

    it('should fire an animate drop action if combining, even if no movement is required', () => {
      const mock = jest.fn();
      const store: Store = createStore(passThrough(mock), middleware);

      const inSnapMode: InitialPublishArgs = {
        ...initialPublishArgs,
        movementMode: 'SNAP',
      };
      store.dispatch(initialPublish(inSnapMode));
      store.dispatch(
        updateDroppableIsCombineEnabled({
          id: inSnapMode.critical.droppable.id,
          isCombineEnabled: true,
        }),
      );
      {
        const current: State = store.getState();
        invariant(current.phase === 'DRAGGING');
        invariant(current.movementMode === 'SNAP');
        invariant(
          current.dimensions.droppables[inSnapMode.critical.droppable.id]
            .isCombineEnabled,
        );
      }
      // combine
      store.dispatch(moveDown());
      // move past and shift item up
      store.dispatch(moveDown());
      // move backwards onto the displaced item
      store.dispatch(moveUp());
      mock.mockReset();

      const current: State = store.getState();
      invariant(current.isDragging);

      if (reason === 'DROP') {
        // impact is cleared when cancelling
        const merge: ?CombineImpact = current.impact.merge;
        invariant(merge);
        const combine: Combine = merge.combine;
        invariant(combine);
        // moved forwards past in home2, and then backwards onto it
        expect(combine).toEqual({
          draggableId: preset.inHome2.descriptor.id,
          droppableId: preset.home.descriptor.id,
        });

        store.dispatch(drop({ reason }));

        const combineDropImpact: DragImpact = getDropImpact({
          reason,
          draggables: preset.draggables,
          lastImpact: current.impact,
          home: preset.home,
          viewport: preset.viewport,
          onLiftImpact: homeImpact,
          onLift,
        }).impact;

        console.log('mock', mock.mock.calls[1][0].payload.completed);

        const completed: CompletedDrag = {
          critical,
          impact: combineDropImpact,
          result: {
            ...getDragStart(),
            // we are using snap movements
            mode: 'SNAP',
            destination: null,
            combine,
            reason,
          },
        };
        const args: AnimateDropArgs = {
          completed,
          newHomeClientOffset: getNewHomeClientOffset({
            impact: combineDropImpact,
            draggable: preset.inHome1,
            dimensions: preset.dimensions,
            viewport: preset.viewport,
            onLift,
          }),
          dropDuration: getDropDuration({
            current: origin,
            destination: origin,
            reason,
          }),
        };
        expect(mock).toHaveBeenCalledWith(drop({ reason }));
        expect(mock).toHaveBeenCalledWith(animateDrop(args));
        expect(mock).toHaveBeenCalledTimes(2);
        expect(store.getState().phase).toBe('DROP_ANIMATING');
        return;
      }

      // CANCEL
      // there will be no animation as we are already in the right spot
      store.dispatch(drop({ reason }));
      // const result: DropResult = {
      //   ...getDragStart(),
      //   mode: 'SNAP',
      //   reason,
      //   destination: null,
      //   combine: null,
      // };
      // const completed: CompletedDrag = {
      //   ...getCompletedArgs(reason).completed,
      //   result: {
      //     ...getDragStart(),
      //     // we are using snap movements
      //     mode: 'SNAP',
      //     destination: null,
      //     combine: null,
      //     reason,
      //   },
      // };
      // const args: AnimateDropArgs = {
      //   completed,
      //   newHomeClientOffset: origin,
      //   dropDuration: getDropDuration({
      //     current: origin,
      //     destination: origin,
      //     reason,
      //   }),
      // };
      expect(mock).toHaveBeenCalledWith(drop({ reason }));
      expect(mock).toHaveBeenCalledWith(completeDrop(getCompletedArgs(reason)));
      expect(mock).toHaveBeenCalledTimes(2);
      expect(store.getState().phase).toBe('IDLE');
    });
  });
});
