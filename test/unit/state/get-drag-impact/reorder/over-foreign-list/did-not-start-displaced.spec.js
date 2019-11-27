// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { add } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../util/dimension';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  DragImpact,
  Viewport,
  DisplacedBy,
} from '../../../../../../src/types';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import afterPoint from '../../../../../util/after-point';
import beforePoint from '../../../../../util/before-point';
import { getForcedDisplacement } from '../../../../../util/impact';
import {
  getCenterForStartEdge,
  getCenterForEndEdge,
} from '../../util/get-center-for-edge';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    const centerForStartOnInForeign2Center: Position = getCenterForStartEdge({
      startEdgeOn: preset.inForeign2.page.borderBox.center,
      dragging: preset.inHome1.page.borderBox,
      axis,
    });

    const goingBackwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: beforePoint(axis, centerForStartOnInForeign2Center),
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousImpact: homeImpact,
      viewport,
      afterCritical,
    });

    it('should displace items when moving backwards past their bottom edge', () => {
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: centerForStartOnInForeign2Center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              // ordered by closest to current location
              // animated and visible as it is a foreign list
              { dimension: preset.inForeign3 },
              { dimension: preset.inForeign4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // is now in position of inForeign3
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };

        expect(impact).toEqual(expected);
      }

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // ordered by closest to current location
          visible: [
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            // is now in position of inForeign2
            droppableId: preset.inForeign2.descriptor.droppableId,
            index: preset.inForeign2.descriptor.index,
          },
        },
      };
      expect(goingBackwards).toEqual(expected);
    });

    it('should end displacement if moving forward over the displaced center', () => {
      const centerForEndOnInForeign2Center: Position = getCenterForEndEdge({
        endEdgeOn: preset.inForeign2.page.borderBox.center,
        dragging: preset.inHome1.page.borderBox,
        axis,
      });
      const displaced: Position = add(
        centerForEndOnInForeign2Center,
        displacedBy.point,
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: displaced,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingBackwards,
          viewport,
          afterCritical,
        });
        expect(impact).toEqual(goingBackwards);
      }
      // no longer displace as we have moved forwards past the displaced center
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(axis, displaced),
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingBackwards,
          viewport,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest impacted
            visible: [
              { dimension: preset.inForeign3 },
              { dimension: preset.inForeign4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // is now in position of inForeign3
              droppableId: preset.inForeign3.descriptor.droppableId,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
