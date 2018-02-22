// @flow
import {
  add,
  absolute,
  isEqual,
  patch,
  subtract,
} from '../../../src/state/position';
import getArea from '../../../src/state/get-area';
import moveToEdge from '../../../src/state/move-to-edge';
import { vertical, horizontal } from '../../../src/state/axis';
import type {
  Area,
  Axis,
  Position,
} from '../../../src/types';

// behind the destination
// width: 40, height: 20
const behind: Area = getArea({
  top: 0,
  left: 0,
  right: 40,
  bottom: 20,
});

// in front of the destination
// width: 50, height: 10
const infront: Area = getArea({
  top: 120,
  left: 150,
  right: 200,
  bottom: 130,
});

// width: 50, height: 60
const destination: Area = getArea({
  top: 50,
  left: 50,
  right: 100,
  bottom: 110,
});

// All results are aligned on the crossAxisStart

const pullBackwardsOnMainAxis = (axis: Axis) => (point: Position) => patch(
  axis.line,
  -point[axis.line],
  point[axis.crossAxisLine]
);

// returns the absolute difference of the center position
// to one of the corners on the axis.end. Choosing axis.end is arbitrary
const getCenterDiff = (axis: Axis) => (source: Area): Position => {
  const corner = patch(
    axis.line, source[axis.end], source[axis.crossAxisStart]
  );

  const diff = absolute(subtract(source.center, corner));

  (() => {
    // a little check to ensure that our assumption that the distance between the edges
    // and the axis.end is the same
    const otherCorner = patch(
      axis.line, source[axis.end], source[axis.crossAxisEnd]
    );
    const otherDiff = absolute(subtract(source.center, otherCorner));

    if (!isEqual(diff, otherDiff)) {
      throw new Error('invalidation position assumption');
    }
  })();

  return diff;
};

describe('move to edge', () => {
  [behind, infront].forEach((source: Area) => {
    describe(`source is ${source === behind ? 'behind' : 'infront of'} destination`, () => {
      describe('moving to a vertical list', () => {
        const pullUpwards = pullBackwardsOnMainAxis(vertical);
        const centerDiff = getCenterDiff(vertical)(source);

        describe('destination start edge', () => {
          const destinationTopCorner: Position = {
            x: destination.left,
            y: destination.top,
          };

          describe('to source end edge', () => {
            it('should move the source above the destination', () => {
              const newCenter: Position = add(
                pullUpwards(centerDiff),
                destinationTopCorner
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'end',
                destination,
                destinationEdge: 'start',
                destinationAxis: vertical,
              });

              expect(result).toEqual(newCenter);
            });
          });

          describe('to source start edge', () => {
            it('should move below the top of the destination', () => {
              const newCenter: Position = add(
                centerDiff,
                destinationTopCorner,
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'start',
                destination,
                destinationEdge: 'start',
                destinationAxis: vertical,
              });

              expect(result).toEqual(newCenter);
            });
          });
        });

        describe('destination end edge', () => {
          const destinationBottomCorner: Position = {
            x: destination.left,
            y: destination.bottom,
          };

          describe('to source end edge', () => {
            it('should move above the bottom of the destination', () => {
              const newCenter: Position = add(
                pullUpwards(centerDiff),
                destinationBottomCorner,
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'end',
                destination,
                destinationEdge: 'end',
                destinationAxis: vertical,
              });

              expect(result).toEqual(newCenter);
            });
          });

          describe('to source start edge', () => {
            it('should move below the destination', () => {
              const newCenter: Position = add(
                centerDiff,
                destinationBottomCorner,
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'start',
                destination,
                destinationEdge: 'end',
                destinationAxis: vertical,
              });

              expect(result).toEqual(newCenter);
            });
          });
        });
      });

      describe('moving to a horizontal list', () => {
        const pullLeft = pullBackwardsOnMainAxis(horizontal);
        const centerDiff = getCenterDiff(horizontal)(source);

        describe('destination start edge', () => {
          const destinationTopCorner: Position = {
            x: destination.left, // axis.start
            y: destination.top, // axis.crossAxisStart
          };

          describe('to source end edge', () => {
            it('should move the source to the left of destination start edge', () => {
              const newCenter: Position = add(
                pullLeft(centerDiff),
                destinationTopCorner
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'end',
                destination,
                destinationEdge: 'start',
                destinationAxis: horizontal,
              });

              expect(result).toEqual(newCenter);
            });
          });

          describe('to source start edge', () => {
            it('should move to the right of the destination start edge', () => {
              const newCenter: Position = add(
                centerDiff,
                destinationTopCorner,
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'start',
                destination,
                destinationEdge: 'start',
                destinationAxis: horizontal,
              });

              expect(result).toEqual(newCenter);
            });
          });
        });

        describe('destination end edge', () => {
          const destinationTopRightCorner: Position = {
            x: destination.right, // axis.end
            y: destination.top, // axis.crossAxisStart
          };

          describe('to source end edge', () => {
            it('should move to the left of right side of the destination', () => {
              const newCenter: Position = add(
                pullLeft(centerDiff),
                destinationTopRightCorner,
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'end',
                destination,
                destinationEdge: 'end',
                destinationAxis: horizontal,
              });

              expect(result).toEqual(newCenter);
            });
          });

          describe('to source start edge', () => {
            it('should move to the right of the destination', () => {
              const newCenter: Position = add(
                centerDiff,
                destinationTopRightCorner,
              );

              const result: Position = moveToEdge({
                source,
                sourceEdge: 'start',
                destination,
                destinationEdge: 'end',
                destinationAxis: horizontal,
              });

              expect(result).toEqual(newCenter);
            });
          });
        });
      });
    });
  });
});
