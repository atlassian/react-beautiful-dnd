// @flow
import type { Position } from 'css-box-model';
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import { patch, negate } from '../../../../src/state/position';
import getStatePreset from '../../../utils/get-simple-state-preset';
import {
  draggingStates,
  withImpact,
  withPending,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './get-own-props';
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
} from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();

const ownProps: OwnProps = getOwnProps(preset.inHome2);
const axis: Axis = preset.home.axis;

const inHome1Amount: Position = patch(
  axis.line,
  preset.inHome1.client.marginBox[axis.size],
);

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase ${current.phase}`, () => {
    describe('was displaced before drop', () => {
      it('should continue to be moved out of the way', () => {
        const selector: Selector = makeMapStateToProps();
        const impact: DragImpact = {
          movement: {
            displaced: [
              {
                draggableId: ownProps.draggableId,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
            amount: inHome1Amount,
            isBeyondStartPosition: true,
          },
          direction: preset.home.axis.direction,
          destination: {
            index: preset.inHome1.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        };
        const dragging: IsDraggingState = withImpact(current, impact);
        const whileDragging: MapProps = selector(dragging, ownProps);

        const expected: MapProps = {
          isDropAnimating: false,
          isDragging: false,
          // inHome2 will be moving backwards
          offset: negate(inHome1Amount),
          shouldAnimateDisplacement: true,
          // not relevant
          shouldAnimateDragMovement: false,
          dimension: null,
          draggingOver: null,
        };
        expect(whileDragging).toEqual(expected);
      });

      it('should not break memoization from the dragging phase', () => {
        const selector: Selector = makeMapStateToProps();
        const impact: DragImpact = {
          movement: {
            displaced: [
              {
                draggableId: ownProps.draggableId,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
            amount: inHome1Amount,
            isBeyondStartPosition: true,
          },
          direction: preset.home.axis.direction,
          destination: {
            index: preset.inHome1.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        };
        const dragging: IsDraggingState = withImpact(current, impact);
        const whileDragging: MapProps = selector(dragging, ownProps);
        // little validation
        expect(whileDragging.offset).toEqual(negate(inHome1Amount));

        const pending: PendingDrop = {
          newHomeOffset: { x: 10, y: 20 },
          // being super caucious
          impact: JSON.parse(JSON.stringify(impact)),
          result: state.dropAnimating().pending.result,
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
          isDropAnimating: false,
          isDragging: false,
          // inHome2 will be moving backwards
          offset: { x: 0, y: 0 },
          shouldAnimateDisplacement: true,
          // not relevant
          shouldAnimateDragMovement: false,
          dimension: null,
          draggingOver: null,
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
