// @flow
import type {
  Position,
  DimensionFragment,
} from '../../../src/types';
import getFragment from '../../utils/get-fragment';
import getClientRect from '../../utils/get-client-rect';
import moveToEdge from '../../../src/state/move-to-edge';
import { vertical, horizontal } from '../../../src/state/axis';

// width: 40, height: 20
const source: DimensionFragment = getFragment(getClientRect({
  top: 0,
  left: 0,
  right: 40,
  bottom: 20,
}));

// width: 50, height: 60
const destination: DimensionFragment = getFragment(getClientRect({
  top: 50,
  left: 50,
  right: 100,
  bottom: 110,
}));

// All results are aligned on the crossAxisStart

describe('move to edge', () => {
  describe('moving to vertical list', () => {
    describe('destination start edge', () => {
      describe('to source end edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 50,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'end',
            destination,
            destinationEdge: 'start',
            destinationAxis: vertical,
          });

          expect(result).toEqual(center);
        });
      });

      describe('to source start edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 70,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'start',
            destination,
            destinationEdge: 'start',
            destinationAxis: vertical,
          });

          expect(result).toEqual(center);
        });
      });
    });

    describe('destination end edge', () => {
      describe('to source end edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 90,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'end',
            destination,
            destinationEdge: 'end',
            destinationAxis: vertical,
          });

          expect(result).toEqual(center);
        });
      });

      describe('to source start edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 110,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'start',
            destination,
            destinationEdge: 'end',
            destinationAxis: vertical,
          });

          expect(result).toEqual(center);
        });
      });
    });
  });

  describe.skip('moving to horizontal list', () => {
    describe('destination start edge', () => {
      describe('to source end edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 50,
            y: 70,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'end',
            destination,
            destinationEdge: 'start',
            destinationAxis: horizontal,
          });

          expect(result).toEqual(center);
        });
      });

      describe('to source start edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 70,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'start',
            destination,
            destinationEdge: 'start',
            destinationAxis: horizontal,
          });

          expect(result).toEqual(center);
        });
      });
    });

    describe('destination end edge', () => {
      describe('to source end edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 90,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'end',
            destination,
            destinationEdge: 'end',
            destinationAxis: vertical,
          });

          expect(result).toEqual(center);
        });
      });

      describe('to source start edge', () => {
        it('should move to the correct position', () => {
          const center: Position = {
            x: 70,
            y: 110,
          };

          const result: Position = moveToEdge({
            source,
            sourceEdge: 'start',
            destination,
            destinationEdge: 'end',
            destinationAxis: vertical,
          });

          expect(result).toEqual(center);
        });
      });
    });
  });
});
