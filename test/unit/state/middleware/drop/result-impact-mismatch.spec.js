// @flow
import invariant from 'tiny-invariant';
import {
  type AnimateDropArgs,
  drop,
  initialPublish,
  move,
  moveDown,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/drop';
import { enableCombining } from '../../../../util/dimension';
import { initialPublishArgs } from '../../../../util/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type { State, CompletedDrag } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import {
  tryGetDestination,
  tryGetCombine,
} from '../../../../../src/state/get-impact-location';

it('should clear any destination from a final impact if not dropping on a droppable', () => {
  const mock = jest.fn();
  const store: Store = createStore(passThrough(mock), middleware);

  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  const initial: State = store.getState();
  invariant(initial.phase === 'DRAGGING');
  invariant(tryGetDestination !== null);

  // no destination
  store.dispatch(move({ client: { x: 10000, y: 10000 } }));
  {
    const current: State = store.getState();
    invariant(current.phase === 'DRAGGING');
    expect(tryGetDestination(current.impact)).toBe(null);
  }

  // drop
  store.dispatch(drop({ reason: 'DROP' }));

  const args: AnimateDropArgs =
    mock.mock.calls[mock.mock.calls.length - 1][0].payload;
  const completed: CompletedDrag = args.completed;

  // the impact has the home destination for animation
  expect(tryGetDestination(completed.impact)).toBe(
    tryGetDestination(initial.impact),
  );
  // but the consumer will be told that there was no destination
  expect(completed.result.destination).toBe(null);
});

it('should clear any destination from a final impact canceling', () => {
  const mock = jest.fn();
  const store: Store = createStore(passThrough(mock), middleware);

  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  const initial: State = store.getState();
  invariant(initial.phase === 'DRAGGING');
  invariant(tryGetDestination(initial.impact) !== null);

  // cancel
  store.dispatch(drop({ reason: 'CANCEL' }));

  const args: AnimateDropArgs =
    mock.mock.calls[mock.mock.calls.length - 1][0].payload;
  const completed: CompletedDrag = args.completed;

  // the impact has the home destination for animation
  expect(tryGetDestination(completed.impact)).toBe(
    tryGetDestination(initial.impact),
  );
  // but the consumer will be told that there was no destination
  expect(completed.result.destination).toBe(null);
});

it('should clear any combine from a final impact if cancelling', () => {
  const mock = jest.fn();
  const store: Store = createStore(passThrough(mock), middleware);

  store.dispatch(
    initialPublish({
      ...initialPublishArgs,
      dimensions: {
        draggables: initialPublishArgs.dimensions.draggables,
        droppables: enableCombining(initialPublishArgs.dimensions.droppables),
      },
      movementMode: 'SNAP',
    }),
  );
  expect(store.getState().phase).toBe('DRAGGING');
  const initial: State = store.getState();
  invariant(initial.phase === 'DRAGGING');
  invariant(tryGetDestination(initial.impact) !== null);

  // moving onto a combine
  store.dispatch(moveDown());
  {
    const current: State = store.getState();
    invariant(current.phase === 'DRAGGING');
    expect(tryGetDestination(current.impact)).toBe(null);
    expect(tryGetCombine(current.impact)).toBeTruthy();
  }

  // drop
  store.dispatch(drop({ reason: 'CANCEL' }));

  const args: AnimateDropArgs =
    mock.mock.calls[mock.mock.calls.length - 1][0].payload;
  const completed: CompletedDrag = args.completed;

  // the combine has been removed
  expect(tryGetCombine(completed.impact)).toBe(null);
  // for animation purposes it has a final impact of moving back to the starting position
  expect(tryGetDestination(completed.impact)).toBe(
    tryGetDestination(initial.impact),
  );
  // the consumer will be told that there was no combine
  expect(completed.result.combine).toBe(null);
});
