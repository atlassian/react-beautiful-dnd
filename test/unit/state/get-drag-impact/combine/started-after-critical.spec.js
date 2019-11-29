// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { getPreset, enableCombining } from '../../../../util/dimension';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { patch, subtract, add } from '../../../../../src/state/position';
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import afterPoint from '../../../../util/after-point';
import beforePoint from '../../../../util/before-point';
import { getForcedDisplacement } from '../../../../util/impact';
import noImpact, { emptyGroups } from '../../../../../src/state/no-impact';
import { getThreshold } from '../util/get-combine-threshold';
import {
  getOffsetForEndEdge,
  getOffsetForStartEdge,
} from '../util/get-offset-for-edge';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome2,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
    const withCombineEnabled: DroppableDimensionMap = enableCombining(
      preset.droppables,
    );
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
    );
    const combineWithInHome3Impact: DragImpact = {
      displaced: getForcedDisplacement({
        // ordered by closest to current location
        // displaced is not animated as it was the starting displacement
        visible: [
          { dimension: preset.inHome3, shouldAnimate: false },
          { dimension: preset.inHome4, shouldAnimate: false },
        ],
      }),
      displacedBy,
      at: {
        type: 'COMBINE',
        combine: {
          draggableId: preset.inHome3.descriptor.id,
          droppableId: preset.inHome3.descriptor.droppableId,
        },
      },
    };

    const startOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.start],
      preset.inHome3.page.borderBox.center[axis.crossAxisLine],
    );
    const endOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.end],
      preset.inHome3.page.borderBox.center[axis.crossAxisLine],
    );
    const inHome3Threshold: Position = getThreshold(axis, preset.inHome3);

    describe('moving onto displaced item', () => {
      const combineStart: Position = add(startOfInHome3, inHome3Threshold);
      const combineEnd: Position = subtract(endOfInHome3, inHome3Threshold);

      it('should move onto a target once it hits (1/5) of the targets size ', () => {
        const offset: Position = getOffsetForEndEdge({
          endEdgeOn: combineStart,
          dragging: preset.inHome2.page.borderBox,
          axis,
        });

        // sitting on combine point
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: offset,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            afterCritical,
          });

          expect(impact).toEqual(homeImpact);
        }
        // gone past combine point
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: afterPoint(axis, offset),
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            afterCritical,
          });

          expect(impact).toEqual(combineWithInHome3Impact);
        }
      });

      it('should remain displaced until the bottom of the dragging item goes onto the (4/5) mark', () => {
        const offset: Position = getOffsetForEndEdge({
          endEdgeOn: combineEnd,
          dragging: preset.inHome2.page.borderBox,
          axis,
        });
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: beforePoint(axis, offset),
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            afterCritical,
          });

          expect(impact).toEqual(combineWithInHome3Impact);
        }
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: offset,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            afterCritical,
          });

          const expected: DragImpact = {
            displaced: getForcedDisplacement({
              visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
            }),
            displacedBy,
            at: {
              type: 'REORDER',
              // now in position of inHome3
              destination: {
                index: preset.inHome3.descriptor.index,
                droppableId: preset.inHome3.descriptor.droppableId,
              },
            },
          };
          expect(impact).toEqual(expected);
        }
      });
    });

    describe('moving backwards onto un displaced item', () => {
      const displacedStartOfInHome3: Position = subtract(
        startOfInHome3,
        displacedBy.point,
      );
      const displacedEndOfInHome3: Position = subtract(
        endOfInHome3,
        displacedBy.point,
      );
      const combineStart: Position = add(
        displacedStartOfInHome3,
        inHome3Threshold,
      );
      const combineEnd: Position = subtract(
        displacedEndOfInHome3,
        inHome3Threshold,
      );

      const combineWithDisplacedInHome3Impact: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            // inHome3 is not displaced. It is visibly displaced as the initial displacement has been removed
            { dimension: preset.inHome4, shouldAnimate: false },
          ],
        }),
        displacedBy,
        at: {
          type: 'COMBINE',
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
        },
      };

      // have moved past merging with inHome3
      const first: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          // now in position of inHome3
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
        },
      };

      it('should move backwards onto an item that has shifted backwards', () => {
        const offset: Position = getOffsetForStartEdge({
          startEdgeOn: combineEnd,
          dragging: preset.inHome2.page.borderBox,
          axis,
        });

        // have not moved far enough backwards yet
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: offset,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: first,
            viewport: preset.viewport,
            afterCritical,
          });
          expect(impact.at).toHaveProperty('type', 'REORDER');
        }
        // moved back enough
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: beforePoint(axis, offset),
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: first,
            viewport: preset.viewport,
            afterCritical,
          });

          expect(impact).toEqual(combineWithDisplacedInHome3Impact);
        }
      });

      it('should no longer combine with an item once it hits the top threshold', () => {
        const offset: Position = getOffsetForStartEdge({
          startEdgeOn: combineStart,
          dragging: preset.inHome2.page.borderBox,
          axis,
        });

        // have not moved far enough backwards yet
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: afterPoint(axis, offset),
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: first,
            viewport: preset.viewport,
            afterCritical,
          });
          expect(impact).toEqual(combineWithDisplacedInHome3Impact);
        }
        // moved back enough
        {
          const impact: DragImpact = getDragImpact({
            pageOffset: offset,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: first,
            viewport: preset.viewport,
            afterCritical,
          });

          expect(impact.at).toHaveProperty('type', 'REORDER');
        }
      });
    });

    // - dragging inHome3 out of home
    // - inHome4 will have shifted backwards
    // - re-enter home list
    it('should understand that when re-entering a list, items that started displaced no longer are', () => {
      const endOfInHome4: Position = patch(
        axis.line,
        preset.inHome4.page.borderBox[axis.end],
        preset.inHome4.page.borderBox.center[axis.crossAxisLine],
      );
      const displacedEndOfInHome4: Position = subtract(
        endOfInHome4,
        displacedBy.point,
      );
      const inHome4Threshold: Position = getThreshold(axis, preset.inHome4);
      const combineEnd: Position = subtract(
        displacedEndOfInHome4,
        inHome4Threshold,
      );

      const offset: Position = getOffsetForStartEdge({
        startEdgeOn: combineEnd,
        dragging: preset.inHome4.page.borderBox,
        axis,
      });

      console.log('offset', offset);

      const impact: DragImpact = getDragImpact({
        pageOffset: beforePoint(axis, offset),
        draggable: preset.inHome3,
        draggables: preset.draggables,
        droppables: withCombineEnabled,
        // out of the list
        previousImpact: noImpact,
        viewport: preset.viewport,
        afterCritical,
      });
      const expected: DragImpact = {
        displaced: emptyGroups,
        displacedBy: getDisplacedBy(axis, preset.inHome3.displaceBy),
        // below inHome4
        at: {
          type: 'REORDER',
          destination: {
            droppableId: preset.inHome3.descriptor.droppableId,
            index: preset.inHome4.descriptor.index,
          },
        },
      };
      expect(impact).toEqual(expected);
    });
  });
});
