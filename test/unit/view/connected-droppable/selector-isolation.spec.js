// @flow
import getStatePreset from '../../../util/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type { State } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
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
  const defaultForeignMapProps: MapProps = foreignSelector(
    state.idle,
    foreignOwnProps,
  );

  state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
    const initial: MapProps = homeSelector(current, homeOwnProps);

    // home should not break memoization of foreign
    expect(foreignSelector(current, foreignOwnProps)).toBe(
      defaultForeignMapProps,
    );

    // foreign should not break memoization of home
    expect(homeSelector(current, homeOwnProps)).toBe(initial);
  });
});
