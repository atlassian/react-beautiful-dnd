// @flow
import getStatePreset from '../../../utils/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type { State, DroppableDimension } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './get-own-props';
import { getPreset } from '../../../utils/dimension';

const preset = getPreset();
const state = getStatePreset();

const restingProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null,
};

describe('home list', () => {
  const ownProps: OwnProps = getOwnProps(preset.home);
  it('should not break memoization between IDLE and PREPARING phases', () => {
    const selector: Selector = makeMapStateToProps();

    const defaultProps: MapProps = selector(state.idle, ownProps);
    // checking value
    expect(defaultProps).toEqual(restingProps);
    // checking memoization
    expect(selector(state.preparing, ownProps)).toBe(defaultProps);
  });

  describe('is dragging over', () => {
    it('should indicate that it is being dragged over', () => {
      const selector: Selector = makeMapStateToProps();
      const props: MapProps = selector(state.dragging(preset.inHome1.descriptor.id), ownProps);

      const expected: MapProps = {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        // no placeholder when dragging in own list
        placeholder: null,
      };
      expect(props).toEqual(expected);
    });

    it('should not break memoization between moves', () => {
      const selector: Selector = makeMapStateToProps();
      const base: DraggingState = state.dragging(preset.inHome1.descriptor.id);
    });
  });

  describe('is not dragging over', () => {
    it('should indicate that it is not being dragged over', () => {

    });

    it('should not break memoization between moves', () => {

    });
  });
});

describe('foreign list', () => {
  // as above, but also that placeholder is there!
});
