// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import {
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './util/get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type {
  Axis,
  DragImpact,
  DropAnimatingState,
  DisplacedBy,
} from '../../../../src/types';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getSecondaryMapProps from './util/get-secondary-map-props';
import { getSecondarySnapshot } from './util/get-snapshot';

const preset = getPreset();
const state = getStatePreset();
const axis: Axis = preset.home.axis;

const displacedBy: DisplacedBy = getDisplacedBy(
  axis,
  preset.inHome1.displaceBy,
);

const impact: DragImpact = state.dropAnimating().completed.impact;

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase ${current.phase}`, () => {
    describe('was displaced before drop', () => {
      const ownProps: OwnProps = getOwnProps(preset.inHome2);
      it('should continue to be moved out of the way', () => {
        const selector: Selector = makeMapStateToProps();

        const dragging: IsDraggingState = withImpact(current, impact);
        const whileDragging: MapProps = selector(dragging, ownProps);

        const expected: MapProps = {
          mapped: {
            type: 'SECONDARY',
            offset: displacedBy.point,
            combineTargetFor: null,
            shouldAnimateDisplacement: false,
            snapshot: getSecondarySnapshot({
              combineTargetFor: null,
            }),
          },
        };
        expect(whileDragging).toEqual(expected);
      });

      it('should not break memoization from the dragging phase', () => {
        const selector: Selector = makeMapStateToProps();
        const dragging: IsDraggingState = withImpact(current, impact);
        const whileDragging: MapProps = selector(dragging, ownProps);

        // little validation
        expect(getSecondaryMapProps(whileDragging).offset).toEqual(
          displacedBy.point,
        );

        const dropping: DropAnimatingState = JSON.parse(
          JSON.stringify(state.dropAnimating()),
        );
        const whileDropping: MapProps = selector(dropping, ownProps);
        expect(whileDropping).toBe(whileDragging);
      });
    });

    describe('was not displaced before drop', () => {
      it('should not break memoization', () => {
        const ownProps: OwnProps = getOwnProps(preset.inForeign1);
        const selector: Selector = makeMapStateToProps();
        const expected: MapProps = {
          mapped: {
            type: 'SECONDARY',
            offset: { x: 0, y: 0 },
            shouldAnimateDisplacement: true,
            combineTargetFor: null,
            snapshot: getSecondarySnapshot({
              combineTargetFor: null,
            }),
          },
        };

        const resting: MapProps = selector(state.idle, ownProps);
        expect(resting).toEqual(expected);
        const dragging: MapProps = selector(state.dragging(), ownProps);
        expect(dragging).toBe(resting);
        const dropping: MapProps = selector(state.userCancel(), ownProps);
        expect(dropping).toBe(resting);
      });
    });
  });
});
