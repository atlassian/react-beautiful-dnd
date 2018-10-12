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
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/drop';
import getDropDuration from '../../../../../src/state/middleware/drop/get-drop-duration';
import { add, origin } from '../../../../../src/state/position';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type {
  DropResult,
  PendingDrop,
  DraggableLocation,
  DropReason,
  DragImpact,
  State,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import noImpact from '../../../../../src/state/no-impact';

['DROP', 'CANCEL'].forEach((reason: DropReason) => {
  describe(`with drop reason: ${reason}`, () => {
    const destination: ?DraggableLocation =
      reason === 'CANCEL' ? null : getDragStart().source;

    it('should fire a complete drop action is no drop animation is required', () => {
      const mock = jest.fn();
      const store: Store = createStore(passThrough(mock), middleware);

      store.dispatch(clean());
      store.dispatch(initialPublish(initialPublishArgs));
      expect(store.getState().phase).toBe('DRAGGING');

      // no movement yet
      mock.mockReset();
      store.dispatch(drop({ reason }));

      const result: DropResult = {
        ...getDragStart(),
        destination,
        reason,
        combine: null,
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason }));
      expect(mock).toHaveBeenCalledWith(completeDrop(result));
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
      const impact: DragImpact = reason === 'DROP' ? current.impact : noImpact;

      mock.mockReset();
      store.dispatch(drop({ reason }));

      const pending: PendingDrop = {
        newHomeClientOffset: origin,
        impact,
        dropDuration: getDropDuration({
          current: shift,
          destination: origin,
          reason,
        }),
        result: {
          ...getDragStart(),
          destination,
          combine: null,
          reason,
        },
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason }));
      expect(mock).toHaveBeenCalledWith(animateDrop(pending));
      expect(mock).toHaveBeenCalledTimes(2);
      expect(store.getState().phase).toBe('DROP_ANIMATING');
    });

    it('should fire an animate drop action if combining, even if no movement is required', () => {
      throw new Error('TODO');
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
      const impact: DragImpact = reason === 'DROP' ? current.impact : noImpact;

      mock.mockReset();
      store.dispatch(drop({ reason }));

      const pending: PendingDrop = {
        newHomeClientOffset: origin,
        impact,
        dropDuration: getDropDuration({
          current: shift,
          destination: origin,
          reason,
        }),
        result: {
          ...getDragStart(),
          destination,
          combine: null,
          reason,
        },
      };
      expect(mock).toHaveBeenCalledWith(drop({ reason }));
      expect(mock).toHaveBeenCalledWith(animateDrop(pending));
      expect(mock).toHaveBeenCalledTimes(2);
      expect(store.getState().phase).toBe('DROP_ANIMATING');
    });
  });
});
