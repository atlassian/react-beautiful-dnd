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

const preset = getPreset();
const state = getStatePreset();

it('should return the default map props and not break memoization', () => {
  const ownProps: OwnProps = getOwnProps(preset.inHome1);
  const selector: Selector = makeMapStateToProps();
  const expected: MapProps = {
    secondary: {
      offset: { x: 0, y: 0 },
      shouldAnimateDisplacement: true,
      combineTargetFor: null,
    },
    dragging: null,
  };

  const first: MapProps = selector(state.idle, ownProps);

  expect(first).toEqual(expected);

  expect(selector(state.idle, ownProps)).toBe(first);
  expect(selector({ ...state.idle }, ownProps)).toBe(first);
});
