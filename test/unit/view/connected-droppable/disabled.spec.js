// @flow
import getStatePreset from '../../../utils/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type { State, DraggingState } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './util/get-own-props';
import { getPreset, disableDroppable } from '../../../utils/dimension';
import resting from './util/resting-props';
import noImpact from '../../../../src/state/no-impact';
import cloneImpact from '../../../utils/clone-impact';
import patchDimensionMap from '../../../../src/state/patch-dimension-map';

const preset = getPreset();
const state = getStatePreset();

describe('home list', () => {
  const ownProps: OwnProps = getOwnProps(preset.home);
  ownProps.isDropDisabled = true;
  const selector: Selector = makeMapStateToProps();

  it('should have the expected disabled props while resting', () => {
    const defaultDisabledProps: MapProps = selector(state.idle, ownProps);
    expect(defaultDisabledProps).toEqual(resting);
  });

  it('should display a placeholder even when disabled', () => {
    const base: DraggingState = state.dragging(preset.inHome1.descriptor.id);
    const getNoWhere = (): DraggingState => ({
      ...base,
      dimensions: patchDimensionMap(
        base.dimensions,
        disableDroppable(preset.home),
      ),
      impact: cloneImpact(noImpact),
    });
    const isHomeButNotOver: MapProps = {
      placeholder: preset.inHome1.placeholder,
      shouldAnimatePlaceholder: false,
      snapshot: {
        isDraggingOver: false,
        draggingOverWith: null,
        draggingFromThisWith: preset.inHome1.descriptor.id,
      },
      useClone: null,
    };

    const result: MapProps = selector(getNoWhere(), ownProps);
    expect(result).toEqual(isHomeButNotOver);

    // memoization
    expect(selector(getNoWhere(), ownProps)).toBe(result);
    expect(selector(getNoWhere(), ownProps)).toBe(result);
  });
});

describe('in foreign list', () => {
  const ownProps: OwnProps = getOwnProps(preset.foreign);
  ownProps.isDropDisabled = true;
  const selector: Selector = makeMapStateToProps();
  const defaultDisabledProps: MapProps = selector(state.idle, ownProps);

  it('should have the expected disabled props while resting', () => {
    expect(defaultDisabledProps).toEqual(resting);
  });

  // always dragging inside of home
  state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
    it(`should return disabled map props when in phase ${current.phase}`, () => {
      const result: MapProps = selector(current, ownProps);
      // memoization check
      expect(result).toBe(defaultDisabledProps);
    });
  });
});
