// @flow
import getStatePreset from '../../../utils/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type {
  DraggingState,
  DragImpact,
  DisplacedBy,
  Combine,
  DropAnimatingState,
  IdleState,
} from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './util/get-own-props';
import { getPreset } from '../../../utils/dimension';
import {
  move,
  type IsDraggingState,
  withImpact,
} from '../../../utils/dragging-state';
import noImpact from '../../../../src/state/no-impact';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import withCombineImpact from './util/with-combine-impact';
import restingProps from './util/resting-props';

const preset = getPreset();
const state = getStatePreset();

const displacedBy: DisplacedBy = getDisplacedBy(
  preset.foreign.axis,
  preset.inHome1.displaceBy,
);
const overForeign: DragImpact = {
  movement: {
    displaced: [],
    map: {},
    displacedBy,
  },
  direction: preset.foreign.axis.direction,
  destination: {
    index: 0,
    droppableId: preset.foreign.descriptor.id,
  },
  merge: null,
};
it('should immediately remove a placeholder in a foreign list', () => {
  const selector: Selector = makeMapStateToProps();
  const ownProps: OwnProps = getOwnProps(preset.foreign);

  const isOverForeignMapProps: MapProps = {
    isDraggingOver: true,
    draggingFromThisWith: null,
    draggingOverWith: preset.inHome1.descriptor.id,
    placeholder: preset.inHome1.placeholder,
    shouldAnimatePlaceholder: true,
  };

  const dragging: IsDraggingState = withImpact(
    state.dragging(preset.inHome1.descriptor.id),
    overForeign,
  );
  const base: DropAnimatingState = state.dropAnimating();
  const dropping: DropAnimatingState = {
    ...base,
    completed: {
      ...base.completed,
      impact: dragging.impact,
    },
  };
  const done: IdleState = {
    ...state.idle,
    completed: dropping.completed,
  };

  const defaultMapProps: MapProps = selector(state.idle, ownProps);
  const whenDragging: MapProps = selector(dragging, ownProps);
  const whenDropping: MapProps = selector(dropping, ownProps);
  const postDrop: MapProps = selector(done, ownProps);

  expect(whenDragging).toEqual(isOverForeignMapProps);
  // no memoization break
  expect(whenDropping).toBe(whenDragging);
  // going to default props (animation will be blocked by Droppable)
  expect(postDrop).toEqual(defaultMapProps);
});

it('should animate a home placeholder closed if over a foreign list', () => {
  const selector: Selector = makeMapStateToProps();
  const ownProps: OwnProps = getOwnProps(preset.home);

  const isNotOverHomeMapProps: MapProps = {
    isDraggingOver: false,
    draggingFromThisWith: preset.inHome1.descriptor.id,
    draggingOverWith: null,
    placeholder: preset.inHome1.placeholder,
    shouldAnimatePlaceholder: false,
  };

  const dragging: IsDraggingState = withImpact(
    state.dragging(preset.inHome1.descriptor.id),
    overForeign,
  );
  const base: DropAnimatingState = state.dropAnimating();
  const dropping: DropAnimatingState = {
    ...base,
    completed: {
      ...base.completed,
      impact: dragging.impact,
    },
  };
  const done: IdleState = {
    ...state.idle,
    completed: dropping.completed,
  };

  const defaultMapProps: MapProps = selector(state.idle, ownProps);
  const whenDragging: MapProps = selector(dragging, ownProps);
  const whenDropping: MapProps = selector(dropping, ownProps);
  const postDrop: MapProps = selector(done, ownProps);

  expect(whenDragging).toEqual(isNotOverHomeMapProps);
  // no memoization break
  expect(whenDropping).toBe(whenDragging);
  // going to default props (animation enabled)
  expect(postDrop).toEqual(defaultMapProps);
  expect(postDrop.shouldAnimatePlaceholder).toBe(true);
});

it('should immediately remove a home placeholder if dropped in a home list', () => {});

it.only('should immediately remove a home placeholder if a drop is flushed', () => {
  const selector: Selector = makeMapStateToProps();
  const ownProps: OwnProps = getOwnProps(preset.home);

  const isNotOverHomeMapProps: MapProps = {
    isDraggingOver: false,
    draggingFromThisWith: preset.inHome1.descriptor.id,
    draggingOverWith: null,
    placeholder: preset.inHome1.placeholder,
    shouldAnimatePlaceholder: false,
  };

  const dragging: IsDraggingState = withImpact(
    state.dragging(preset.inHome1.descriptor.id),
    overForeign,
  );
  const base: DropAnimatingState = state.dropAnimating();
  const dropping: DropAnimatingState = {
    ...base,
    completed: {
      ...base.completed,
      impact: dragging.impact,
    },
  };
  const done: IdleState = {
    phase: 'IDLE',
    // flushed
    completed: null,
  };

  const defaultMapProps: MapProps = selector(state.idle, ownProps);
  const whenDragging: MapProps = selector(dragging, ownProps);
  const whenDropping: MapProps = selector(dropping, ownProps);
  const postDrop: MapProps = selector(done, ownProps);

  expect(whenDragging).toEqual(isNotOverHomeMapProps);
  // no memoization break
  expect(whenDropping).toBe(whenDragging);
  // animation flushed
  expect(postDrop).toEqual({
    ...defaultMapProps,
    shouldAnimatePlaceholder: false,
  });
});
