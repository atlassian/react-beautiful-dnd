// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import {
  move,
  draggingStates,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './get-own-props';

const preset = getPreset();
const state = getStatePreset();

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase: ${current.phase}`, () => {
    const withoutStyles: IsDraggingState = {
      // for flow
      phase: 'DRAGGING',
      ...move(current, { x: 20, y: 30 }),
      shouldApplyStyles: false,
    };

    it('should not apply dragging styles if asked not to while dragging', () => {
      const ownProps: OwnProps = getOwnProps(preset.inHome1);
      const selector: Selector = makeMapStateToProps();
      const defaultMapProps: MapProps = selector(state.idle, ownProps);

      const result: MapProps = selector(withoutStyles, ownProps);

      expect(result).toBe(defaultMapProps);
    });

    it('should not apply moving out of the way styles if asked not to while dragging', () => {
      const ownProps: OwnProps = getOwnProps(preset.inHome2);
      const selector: Selector = makeMapStateToProps();
      const defaultMapProps: MapProps = selector(state.idle, ownProps);

      const result: MapProps = selector(withoutStyles, ownProps);

      expect(result).toBe(defaultMapProps);
    });
  });
});
