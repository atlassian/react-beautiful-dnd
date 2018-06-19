// @flow
import getStatePreset from '../../../utils/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type { State, DroppableDimension, DraggingState } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './get-own-props';
import { getPreset } from '../../../utils/dimension';
import { move, type IsDraggingState } from '../../../utils/dragging-state';
import noImpact from '../../../../src/state/no-impact';

const preset = getPreset();
const state = getStatePreset();

const restingProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null,
};

const execute = (ownProps: OwnProps) => {

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

      const first: IsDraggingState = move(base, { x: 1, y: 1 });
      const second: IsDraggingState = move(first, { x: 0, y: 1 });
      const third: IsDraggingState = move(second, { x: -1, y: 0 });
      const props1: MapProps = selector(first, ownProps);
      const props2: MapProps = selector(second, ownProps);
      const props3: MapProps = selector(third, ownProps);

      const expected: MapProps = {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        // no placeholder when dragging in own list
        placeholder: null,
      };
      expect(props1).toEqual(expected);
      // memoization check
      expect(props2).toBe(props1);
      expect(props3).toBe(props1);
    });
  });

  describe('is not dragging over', () => {
    const getNoWhere = (): DraggingState => ({
      ...state.dragging(preset.inHome1.descriptor.id),
      impact: { ...noImpact },
    });

    it('should indicate that it is not being dragged over', () => {
      const selector: Selector = makeMapStateToProps();

      const first: MapProps = selector(getNoWhere(), ownProps);
      expect(first).toEqual(restingProps);
    });

    it('should not break memoization between moves', () => {
      const selector: Selector = makeMapStateToProps();

      const first: MapProps = selector(getNoWhere(), ownProps);
      expect(first).toEqual(restingProps);

      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(first);
      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(first);
      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(first);
    });
  });
});

describe('foreign list', () => {
  // as above, but also that placeholder is there!
});
