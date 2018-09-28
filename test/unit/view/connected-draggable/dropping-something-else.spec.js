// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import {
  draggingStates,
  withImpact,
  withPending,
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
  PendingDrop,
  Displacement,
  DisplacedBy,
} from '../../../../src/types';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getSecondaryMapProps from './util/get-secondary-map-props';

const preset = getPreset();
const state = getStatePreset();

const ownProps: OwnProps = getOwnProps(preset.inHome2);
const axis: Axis = preset.home.axis;

const willDisplaceForward: boolean = false;
const displacedBy: DisplacedBy = getDisplacedBy(
  axis,
  preset.inHome1.displaceBy,
  willDisplaceForward,
);
const displaced: Displacement[] = [
  {
    draggableId: ownProps.draggableId,
    isVisible: true,
    shouldAnimate: true,
  },
];
const impact: DragImpact = {
  movement: {
    displaced,
    map: getDisplacementMap(displaced),
    displacedBy,
    willDisplaceForward,
  },
  direction: preset.home.axis.direction,
  destination: {
    index: preset.inHome1.descriptor.index,
    droppableId: preset.home.descriptor.id,
  },
  merge: null,
};

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase ${current.phase}`, () => {
    describe('was displaced before drop', () => {
      it('should continue to be moved out of the way', () => {
        const selector: Selector = makeMapStateToProps();

        const dragging: IsDraggingState = withImpact(current, impact);
        const whileDragging: MapProps = selector(dragging, ownProps);

        const expected: MapProps = {
          dragging: null,
          secondary: {
            offset: displacedBy.point,
            combineTargetFor: null,
            shouldAnimateDisplacement: true,
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

        const base: DropAnimatingState = state.dropAnimating();
        const pending: PendingDrop = {
          newHomeClientOffset: { x: 10, y: 20 },
          // being super caucious
          impact: JSON.parse(JSON.stringify(impact)),
          result: base.pending.result,
          dropDuration: base.pending.dropDuration,
        };

        const dropping: DropAnimatingState = withPending(
          state.dropAnimating(),
          pending,
        );
        const whileDropping: MapProps = selector(dropping, ownProps);
        expect(whileDropping).toBe(whileDragging);
      });
    });

    describe('was not displaced before drop', () => {
      it('should not break memoization', () => {
        const selector: Selector = makeMapStateToProps();
        const expected: MapProps = {
          dragging: null,
          secondary: {
            offset: { x: 0, y: 0 },
            shouldAnimateDisplacement: true,
            combineTargetFor: null,
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
