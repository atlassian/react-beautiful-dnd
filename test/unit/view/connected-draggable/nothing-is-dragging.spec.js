// @flow
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../util/dimension';
import getStatePreset from '../../../util/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import { getSecondarySnapshot } from './util/get-snapshot';

const preset = getPreset();
const state = getStatePreset();

it('should return the default map props and not break memoization', () => {
  const ownProps: OwnProps = getOwnProps(preset.inHome1);
  const selector: Selector = makeMapStateToProps();
  const expected: MapProps = {
    mapped: {
      type: 'SECONDARY',
      offset: { x: 0, y: 0 },
      shouldAnimateDisplacement: true,
      combineTargetFor: null,
      snapshot: getSecondarySnapshot({
        descriptor: preset.inHome1.descriptor,
        combineTargetFor: null,
      }),
    },
  };

  const first: MapProps = selector(state.idle, ownProps);

  expect(first).toEqual(expected);

  expect(selector(state.idle, ownProps)).toBe(first);
  expect(selector({ ...state.idle }, ownProps)).toBe(first);
});
