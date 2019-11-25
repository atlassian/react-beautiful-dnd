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
    isUsingPlaceholder: true,
  },
  useClone: null,
};

describe('was over - reordering', () => {
  it('should immediately remove a placeholder', () => {
    const ownProps: OwnProps = getOwnProps(preset.home);
    const selector: Selector = makeMapStateToProps();
    // initial value: not animated
    const atRest: MapProps = selector(state.idle, ownProps);
    expect(atRest.shouldAnimatePlaceholder).toBe(false);

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
    expect(postDrop).toBe(atRest);
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
    // we animate the placeholder closed after dropping
    const expected: MapProps = {
      ...atRest,
      shouldAnimatePlaceholder: true,
    };
    expect(postDrop).toEqual(expected);
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
    const expected: MapProps = {
      ...atRest,
      shouldAnimatePlaceholder: true,
    };
    expect(whileDropping).toEqual(expected);

    // drop complete
    const idle: IdleState = {
      phase: 'IDLE',
      completed: dropping.completed,
      shouldFlush: false,
    };
    const postDrop: MapProps = selector(idle, ownProps);
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
    expect(postDrop).toBe(atRest);
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
    expect(postDrop).toBe(atRest);
    expect(postDrop).toEqual(expected);
  });
});
