// @flow
import getStatePreset from '../../../utils/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type {
  DraggingState,
  DragImpact,
  DisplacedBy,
  Combine,
} from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './get-own-props';
import { getPreset } from '../../../utils/dimension';
import {
  move,
  type IsDraggingState,
  withImpact,
} from '../../../utils/dragging-state';
import noImpact from '../../../../src/state/no-impact';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import withCombineImpact from './util/with-combine-impact';

const preset = getPreset();
const state = getStatePreset();

const restingProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null,
};

describe('home list', () => {
  const ownProps: OwnProps = getOwnProps(preset.home);

  describe('is dragging over', () => {
    it('should indicate that it is being dragged over', () => {
      const selector: Selector = makeMapStateToProps();
      const props: MapProps = selector(
        state.dragging(preset.inHome1.descriptor.id),
        ownProps,
      );

      const expected: MapProps = {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        // no placeholder when dragging in own list
        placeholder: null,
      };
      expect(props).toEqual(expected);
    });

    it('should indicate that it is being combined over', () => {
      const selector: Selector = makeMapStateToProps();
      const base: IsDraggingState = state.dragging(
        preset.inHome1.descriptor.id,
      );
      const combine: Combine = {
        draggableId: preset.inHome2.descriptor.id,
        droppableId: preset.home.descriptor.id,
      };
      const withCombine: IsDraggingState = withImpact(
        base,
        withCombineImpact(base.impact, combine),
      );
      const props: MapProps = selector(withCombine, ownProps);

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
      const combine: Combine = {
        draggableId: preset.inHome2.descriptor.id,
        droppableId: preset.home.descriptor.id,
      };
      const fourth: IsDraggingState = withImpact(
        third,
        withCombineImpact(third.impact, combine),
      );
      const props1: MapProps = selector(first, ownProps);
      const props2: MapProps = selector(second, ownProps);
      const props3: MapProps = selector(third, ownProps);
      const props4: MapProps = selector(fourth, ownProps);

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
      expect(props4).toBe(props1);
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

      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(
        first,
      );
      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(
        first,
      );
      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(
        first,
      );
      const combine: Combine = {
        draggableId: preset.inForeign1.descriptor.id,
        droppableId: preset.foreign.descriptor.id,
      };
      const withCombine: IsDraggingState = withImpact(
        state.dragging(),
        withCombineImpact(state.dragging().impact, combine),
      );
      expect(selector(withCombine, ownProps)).toBe(first);
    });
  });
});

describe('foreign list', () => {
  const ownProps: OwnProps = getOwnProps(preset.foreign);

  describe('is dragging over', () => {
    const willDisplaceForward: boolean = true;
    const displacedBy: DisplacedBy = getDisplacedBy(
      preset.foreign.axis,
      preset.inHome1.displaceBy,
      willDisplaceForward,
    );
    const overForeign: DragImpact = {
      movement: {
        displaced: [],
        map: {},
        displacedBy,
        willDisplaceForward,
      },
      direction: preset.foreign.axis.direction,
      destination: {
        index: 0,
        droppableId: preset.foreign.descriptor.id,
      },
      merge: null,
    };

    it('should indicate that it is being dragged over', () => {
      const selector: Selector = makeMapStateToProps();
      const current: IsDraggingState = withImpact(
        state.dragging(preset.inHome1.descriptor.id),
        overForeign,
      );
      const props: MapProps = selector(current, ownProps);

      const expected: MapProps = {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        // using placeholder when in foreign list
        placeholder: preset.inHome1.placeholder,
      };
      expect(props).toEqual(expected);
    });
    it('should indicate that it is being combined over', () => {
      const selector: Selector = makeMapStateToProps();
      const base: IsDraggingState = state.dragging(
        preset.inHome1.descriptor.id,
      );
      const combine: Combine = {
        draggableId: preset.inForeign1.descriptor.id,
        droppableId: preset.foreign.descriptor.id,
      };
      const withCombine: IsDraggingState = withImpact(
        base,
        withCombineImpact(base.impact, combine),
      );
      const props: MapProps = selector(withCombine, ownProps);

      const expected: MapProps = {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        // placeholder when over foreign list
        placeholder: preset.inHome1.placeholder,
      };
      expect(props).toEqual(expected);
    });

    it('should not break memoization between moves', () => {
      const selector: Selector = makeMapStateToProps();
      const base: IsDraggingState = withImpact(
        state.dragging(preset.inHome1.descriptor.id),
        overForeign,
      );
      const first: IsDraggingState = move(base, { x: 1, y: 1 });
      const second: IsDraggingState = move(first, { x: 0, y: 1 });
      const third: IsDraggingState = move(second, { x: -1, y: 0 });
      const props1: MapProps = selector(first, ownProps);
      const props2: MapProps = selector(second, ownProps);
      const props3: MapProps = selector(third, ownProps);

      const expected: MapProps = {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        // using placeholder when in foreign list
        placeholder: preset.inHome1.placeholder,
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

      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(
        first,
      );
      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(
        first,
      );
      expect(selector(move(getNoWhere(), { x: 1, y: 1 }), ownProps)).toBe(
        first,
      );
    });
  });
});
