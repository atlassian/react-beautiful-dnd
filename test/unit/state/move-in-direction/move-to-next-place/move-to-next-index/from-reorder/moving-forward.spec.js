// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { Result } from '../../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-place-types';
import type {
  Axis,
  DisplacedBy,
  DragImpact,
  DraggableDimension,
  Displacement,
} from '../../../../../../../src/types';
import moveToNextIndex from '../../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-index';
import { vertical, horizontal } from '../../../../../../../src/state/axis';
import { origin, add, patch } from '../../../../../../../src/state/position';
import { getPreset } from '../../../../../../utils/dimension';
import getHomeImpact from '../../../../../../../src/state/get-home-impact';
import getDisplacedBy from '../../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../../src/state/get-displacement-map';

const getVisibleDisplacement = (
  draggable: DraggableDimension,
): Displacement => ({
  isVisible: true,
  shouldAnimate: true,
  draggableId: draggable.descriptor.id,
});

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    describe('in home list', () => {
      describe('moving forward away from start', () => {
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome2.displaceBy,
          willDisplaceForward,
        );

        it('should move into next index and increase backwards displacement', () => {
          const center: Position = preset.inHome2.page.borderBox.center;
          const result: ?Result = moveToNextIndex({
            isMovingForward: true,
            isInHomeList: true,
            draggable: preset.inHome2,
            destination: preset.home,
            draggables: preset.draggables,
            insideDestination: preset.inHomeList,
            previousImpact: getHomeImpact(preset.inHome2, preset.home),
            previousPageBorderBoxCenter: center,
            viewport: preset.viewport,
          });
          invariant(result);

          // need to move forward past the displaced item
          const pageBorderBoxCenter: Position = add(
            center,
            patch(axis.line, preset.inHome3.displaceBy[axis.line]),
          );
          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inHome3),
          ];
          const impact: DragImpact = {
            movement: {
              willDisplaceForward,
              displacedBy,
              displaced,
              map: getDisplacementMap(displaced),
            },
            direction: preset.home.axis.direction,
            destination: {
              index: preset.inHome3.descriptor.index,
              droppableId: preset.home.descriptor.id,
            },
            merge: null,
          };
          const expected: Result = {
            pageBorderBoxCenter,
            impact,
            scrollJumpRequest: null,
          };
          expect(result).toEqual(expected);
        });
      });

      describe('moving forward back towards start', () => {
        // when behind start we displace forward
        const willDisplaceForward: boolean = true;

        it('should move into next index and decrease forwards displacement', () => {});
      });
    });

    describe('in foreign list', () => {
      it('should move into the next position and decrease the amount of forward displaced items', () => {});
    });
  });
});
