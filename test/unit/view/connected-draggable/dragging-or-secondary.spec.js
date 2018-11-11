// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type { State } from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();

it('should always have either a dragging or secondary value populated', () => {
  const inHome1Selector: Selector = makeMapStateToProps();
  const inHome1OwnProps: OwnProps = getOwnProps(preset.inHome1);
  const inHome2Selector: Selector = makeMapStateToProps();
  const inHome2OwnProps: OwnProps = getOwnProps(preset.inHome2);

  state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
    // independent selector
    const mapProps1: MapProps = inHome1Selector(current, inHome1OwnProps);
    const mapProps2: MapProps = inHome2Selector(current, inHome2OwnProps);

    expect(mapProps1.dragging || mapProps2.secondary).toBeTruthy();
    expect(mapProps2.secondary).toBeTruthy();
  });
});
