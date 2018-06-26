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

const execute = (droppable: DroppableDimension) => {
  const ownProps: OwnProps = getOwnProps(droppable);
  ownProps.isDropDisabled = true;
  const selector: Selector = makeMapStateToProps();
  const defaultDisabledProps: MapProps = selector(state.idle, ownProps);
  const expected: MapProps = {
    isDraggingOver: false,
    draggingOverWith: null,
    placeholder: null,
  };

  it('should have the expected disabled props while resting', () => {
    expect(defaultDisabledProps).toEqual(expected);
  });

  // always dragging inside of home
  state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
    it(`should return disabled map props when in phase ${
      current.phase
    }`, () => {
      const result: MapProps = selector(current, ownProps);
      // memoization check
      expect(result).toBe(defaultDisabledProps);
    });
  });
};

describe('home list', () => {
  execute(preset.home);
});

describe('in foreign list', () => {
  execute(preset.foreign);
});
