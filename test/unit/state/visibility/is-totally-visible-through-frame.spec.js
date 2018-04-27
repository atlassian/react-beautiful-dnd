// @flow
import { type Spacing } from 'css-box-model';
import isTotallyVisibleThroughFrame from '../../../../src/state/visibility/is-totally-visible-through-frame';
import { offsetByPosition } from '../../../../src/state/spacing';
import { expandBySpacing } from '../../../utils/spacing';

const frame: Spacing = {
  top: 0, left: 0, right: 100, bottom: 100,
};

describe('is totally visible through frame', () => {
  describe('subject is smaller than frame', () => {
    describe('completely outside frame', () => {
      it('should return false if subject is outside frame on any side', () => {
        const outside: Spacing[] = [
          // outside on top
          offsetByPosition(frame, { x: 0, y: -101 }),
          // outside on right
          offsetByPosition(frame, { x: 101, y: 0 }),
          // outside on bottom
          offsetByPosition(frame, { x: 0, y: 101 }),
          // outside on left
          offsetByPosition(frame, { x: -101, y: 0 }),
        ];

        outside.forEach((subject: Spacing) => {
          expect(isTotallyVisibleThroughFrame(frame)(subject)).toBe(false);
        });
      });
    });

    describe('contained in frame', () => {
      it('should return true when subject is contained within frame', () => {
        const subject: Spacing = {
          top: 10,
          left: 10,
          right: 90,
          bottom: 90,
        };

        expect(isTotallyVisibleThroughFrame(frame)(subject)).toBe(true);
      });
    });

    describe('partially visible', () => {
      it('should return false if partially visible horizontally and vertically', () => {
        const subject: Spacing = {
          // visible
          top: 10,
          // not visible
          bottom: 110,
          // visible
          left: 50,
          // not visible
          right: 150,
        };

        expect(isTotallyVisibleThroughFrame(frame)(subject)).toBe(false);
      });
    });
  });

  describe('subject is equal to frame', () => {
    it('should return true when the frame is equal to the subject', () => {
      expect(isTotallyVisibleThroughFrame(frame)(frame)).toBe(true);
      expect(isTotallyVisibleThroughFrame(frame)({ ...frame })).toBe(true);
    });
  });

  describe('subject is bigger than frame', () => {
    const bigSubject: Spacing = expandBySpacing(frame, frame);

    it('should return false if the subject has no overlap with the frame', () => {
      const subject: Spacing = offsetByPosition(bigSubject, { x: 1000, y: 1000 });

      expect(isTotallyVisibleThroughFrame(frame)(subject)).toBe(false);
    });

    it('should return false if subject is bigger on every side', () => {
      expect(isTotallyVisibleThroughFrame(frame)(bigSubject)).toBe(false);
    });
  });
});
