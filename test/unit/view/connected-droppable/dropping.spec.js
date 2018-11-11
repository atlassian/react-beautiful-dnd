// @flow
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './get-own-props';
import type { State } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';

const preset = getPreset();
const state = getStatePreset();

describe('was being dragged over', () => {
  it('should not break memoization from a reorder', () => {
    const ownProps: OwnProps = getOwnProps(preset.home);
    const selector: Selector = makeMapStateToProps();

    const whileDragging: MapProps = selector(state.dragging(), ownProps);
    const whileDropping: MapProps = selector(state.dropAnimating(), ownProps);

    const expected: MapProps = {
      isDraggingOver: true,
      draggingOverWith: preset.inHome1.descriptor.id,
      placeholder: null,
    };
    expect(whileDragging).toEqual(expected);
    // referential equality: memoization check
    expect(whileDragging).toBe(whileDropping);
  });

  it('should not break memoization from a combine', () => {
    const ownProps: OwnProps = getOwnProps(preset.home);
    const selector: Selector = makeMapStateToProps();

    const whileDragging: MapProps = selector(state.dragging(), ownProps);
    const whileDropping: MapProps = selector(state.dropAnimating(), ownProps);

    const expected: MapProps = {
      isDraggingOver: true,
      draggingOverWith: preset.inHome1.descriptor.id,
      placeholder: null,
    };
    expect(whileDragging).toEqual(expected);
    // referential equality: memoization check
    expect(whileDragging).toBe(whileDropping);
  });
});

describe('was not being dragged over', () => {
  it('should return the default props and not break memoization', () => {
    const ownProps: OwnProps = getOwnProps(preset.foreign);
    const selector: Selector = makeMapStateToProps();
    const defaultProps: MapProps = selector(state.idle, ownProps);

    const atRest: MapProps = {
      isDraggingOver: false,
      draggingOverWith: null,
      placeholder: null,
    };
    expect(defaultProps).toEqual(atRest);

    expect(selector(state.dragging(), ownProps)).toBe(defaultProps);
    expect(selector(state.dropAnimating(), ownProps)).toBe(defaultProps);
  });

  it('should return the default props for every phase', () => {
    const ownProps: OwnProps = getOwnProps(preset.foreign);
    const selector: Selector = makeMapStateToProps();
    const defaultProps: MapProps = selector(state.idle, ownProps);

    [...state.allPhases(), ...state.allPhases().reverse()].forEach(
      (current: State) => {
        expect(selector(current, ownProps)).toBe(defaultProps);
      },
    );
  });
});
