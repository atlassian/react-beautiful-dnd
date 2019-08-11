// @flow
import type {
  DragImpact,
  Combine,
  DropAnimatingState,
  IdleState,
} from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import { getPreset } from '../../../util/dimension';
import getStatePreset from '../../../util/get-simple-state-preset';
import getOwnProps from './util/get-own-props';

const preset = getPreset();
const state = getStatePreset();

const isOverHomeMapProps: MapProps = {
  placeholder: preset.inHome1.placeholder,
  shouldAnimatePlaceholder: false,
  snapshot: {
    isDraggingOver: true,
    draggingOverWith: preset.inHome1.descriptor.id,
    draggingFromThisWith: preset.inHome1.descriptor.id,
  },
  useClone: null,
};

describe('was over - reordering', () => {
  it('should immediately remove a placeholder', () => {
    const ownProps: OwnProps = getOwnProps(preset.home);
    const selector: Selector = makeMapStateToProps();
    // initial value: not animated
    const atRest: MapProps = selector(state.idle, ownProps);
    expect(atRest.shouldAnimatePlaceholder).toBe(true);

    // while dropping
    const dropping: DropAnimatingState = state.dropAnimating(
      preset.inHome1.descriptor.id,
    );
    const whileDropping: MapProps = selector(dropping, ownProps);
    expect(whileDropping).toEqual(isOverHomeMapProps);

    // drop complete
    const idle: IdleState = {
      phase: 'IDLE',
      completed: dropping.completed,
      shouldFlush: false,
    };
    const postDrop: MapProps = selector(idle, ownProps);
    const expected: MapProps = {
      ...atRest,
      shouldAnimatePlaceholder: false,
    };
    expect(postDrop).toEqual(expected);
    // this will cause a memoization break for the next drag
    expect(postDrop).not.toEqual(atRest);
  });
});

describe('was over - merging', () => {
  it('should animate a placeholder closed', () => {
    const ownProps: OwnProps = getOwnProps(preset.home);
    const selector: Selector = makeMapStateToProps();
    const atRest: MapProps = selector(state.idle, ownProps);

    // while dropping
    const combine: Combine = {
      draggableId: preset.inHome2.descriptor.id,
      droppableId: preset.inHome2.descriptor.droppableId,
    };
    const base: DropAnimatingState = state.dropAnimating();
    const combineImpact: DragImpact = {
      ...base.completed.impact,
      at: {
        type: 'COMBINE',
        whenEntered: forward,
        combine,
      },
    };
    const dropping: DropAnimatingState = {
      ...base,
      completed: {
        ...base.completed,
        impact: combineImpact,
        result: {
          ...base.completed.result,
          destination: null,
          combine,
        },
      },
    };
    const whileDropping: MapProps = selector(dropping, ownProps);
    expect(whileDropping).toEqual(isOverHomeMapProps);

    // drop complete
    const idle: IdleState = {
      phase: 'IDLE',
      completed: dropping.completed,
      shouldFlush: false,
    };
    const postDrop: MapProps = selector(idle, ownProps);
    // no memoization break for the next drag - returned at rest props
    expect(postDrop).toBe(atRest);
  });
});

describe('was not over', () => {
  it('should animate a placeholder closed', () => {
    const ownProps: OwnProps = getOwnProps(preset.foreign);
    const selector: Selector = makeMapStateToProps();
    const atRest: MapProps = selector(state.idle, ownProps);

    // while dropping
    const dropping: DropAnimatingState = state.dropAnimating();
    const whileDropping: MapProps = selector(dropping, ownProps);
    expect(whileDropping).toEqual(atRest);

    // drop complete
    const idle: IdleState = {
      phase: 'IDLE',
      completed: dropping.completed,
      shouldFlush: false,
    };
    const postDrop: MapProps = selector(idle, ownProps);
    // no memoization break for the next drag - returned at rest props
    expect(postDrop).toBe(atRest);
  });
});

describe('flushed', () => {
  it('should cut an animation', () => {
    const ownProps: OwnProps = getOwnProps(preset.home);
    const selector: Selector = makeMapStateToProps();
    const atRest: MapProps = selector(state.idle, ownProps);

    // while dropping
    const combine: Combine = {
      draggableId: preset.inHome2.descriptor.id,
      droppableId: preset.inHome2.descriptor.droppableId,
    };
    const base: DropAnimatingState = state.dropAnimating();
    const combineImpact: DragImpact = {
      ...base.completed.impact,
      at: {
        type: 'COMBINE',
        whenEntered: forward,
        combine,
      },
    };
    const dropping: DropAnimatingState = {
      ...base,
      completed: {
        ...base.completed,
        impact: combineImpact,
        result: {
          ...base.completed.result,
          destination: null,
          combine,
        },
      },
    };

    // drop complete
    const withFlush: IdleState = {
      phase: 'IDLE',
      completed: dropping.completed,
      shouldFlush: true,
    };
    const postDrop: MapProps = selector(withFlush, ownProps);
    const expected: MapProps = {
      ...atRest,
      shouldAnimatePlaceholder: false,
    };
    expect(postDrop).not.toBe(atRest);
    expect(postDrop).toEqual(expected);
  });

  it('should cut animation in a list that was not animating', () => {
    const ownProps: OwnProps = getOwnProps(preset.foreign);
    const selector: Selector = makeMapStateToProps();
    const atRest: MapProps = selector(state.idle, ownProps);

    // drop complete
    const withFlush: IdleState = {
      phase: 'IDLE',
      completed: state.dropAnimating().completed,
      shouldFlush: true,
    };
    const postDrop: MapProps = selector(withFlush, ownProps);
    const expected: MapProps = {
      ...atRest,
      shouldAnimatePlaceholder: false,
    };
    expect(postDrop).not.toBe(atRest);
    expect(postDrop).toEqual(expected);
  });
});
