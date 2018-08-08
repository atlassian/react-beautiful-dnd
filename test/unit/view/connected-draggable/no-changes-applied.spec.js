// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type { DragImpact } from '../../../../src/types';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import {
  move,
  draggingStates,
  type IsDraggingState,
  withImpact,
} from '../../../utils/dragging-state';
import getOwnProps from './get-own-props';

const preset = getPreset();
const state = getStatePreset();

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase: ${current.phase}`, () => {
    const withChanges: IsDraggingState = {
      // for flow
      phase: 'DRAGGING',
      ...move(current, { x: 20, y: 30 }),
    };
    const withoutChanges: IsDraggingState = {
      // for flow
      phase: 'DRAGGING',
      ...withChanges,
      shouldApplyChanges: false,
    };

    it('should not apply dragging changes if asked not to while dragging', () => {
      const ownProps: OwnProps = getOwnProps(preset.inHome1);
      const selector: Selector = makeMapStateToProps();
      const defaultMapProps: MapProps = selector(state.idle, ownProps);

      const result: MapProps = selector(withoutChanges, ownProps);

      expect(result).toBe(defaultMapProps);

      // validation - it should not be the default props when applying changes
      expect(selector(withChanges, ownProps)).not.toEqual(defaultMapProps);
    });

    it('should not apply moving out of the way changes if asked not to while dragging', () => {
      const ownProps: OwnProps = getOwnProps(preset.inHome2);
      const selector: Selector = makeMapStateToProps();
      const defaultMapProps: MapProps = selector(state.idle, ownProps);
      const impact: DragImpact = {
        movement: {
          displaced: [
            {
              draggableId: ownProps.draggableId,
              isVisible: true,
              shouldAnimate: true,
            },
          ],
          amount: { x: 20, y: 20 },
          isBeyondStartPosition: true,
        },
        direction: preset.home.axis.direction,
        destination: {
          droppableId: preset.inHome2.descriptor.droppableId,
          index: preset.inHome2.descriptor.index,
        },
      };
      const impacted: IsDraggingState = withImpact(withoutChanges, impact);

      const result: MapProps = selector(impacted, ownProps);

      expect(result).toBe(defaultMapProps);

      // validation - it should not be the default props when applying changes
      expect(selector(withImpact(withChanges, impact), ownProps)).not.toEqual(
        defaultMapProps,
      );
    });
  });
});
