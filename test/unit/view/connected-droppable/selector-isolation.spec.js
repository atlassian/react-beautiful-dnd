// @flow
import getStatePreset from '../../../util/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type { State } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './util/get-own-props';
import { getPreset } from '../../../util/dimension';

const preset = getPreset();
const state = getStatePreset();

it('should not break memoization across selectors', () => {
  const homeSelector: Selector = makeMapStateToProps();
  const homeOwnProps: OwnProps = getOwnProps(preset.home);
  const foreignSelector: Selector = makeMapStateToProps();
  const foreignOwnProps: OwnProps = getOwnProps(preset.foreign);

  state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
    const home1 = homeSelector(current, homeOwnProps);
    const foreign1 = foreignSelector(current, foreignOwnProps);

    const home2 = homeSelector(current, homeOwnProps);
    const foreign2 = foreignSelector(current, foreignOwnProps);

    expect(home1).toBe(home2);
    expect(foreign1).toBe(foreign2);
  });
});
