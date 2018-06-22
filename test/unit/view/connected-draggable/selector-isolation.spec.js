// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type { State } from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();

it('should not break memoization across selectors', () => {
  const inHome1Selector: Selector = makeMapStateToProps();
  const inHome1OwnProps: OwnProps = getOwnProps(preset.inHome1);
  const inHome2Selector: Selector = makeMapStateToProps();
  const inHome2OwnProps: OwnProps = getOwnProps(preset.inHome2);
  const defaultInHome2MapProps: MapProps = inHome2Selector(state.idle, inHome2OwnProps);

  state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
    // independent selector
    inHome1Selector(current, inHome1OwnProps);
    // should not break memoization of inHome2
    expect(inHome2Selector(current, inHome2OwnProps)).toBe(defaultInHome2MapProps);
  });
});
