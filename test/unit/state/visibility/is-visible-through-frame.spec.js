// @flow
import isVisibleThroughFrame from '../../../../src/state/visibility/is-visible-through-frame';
import { add, offset } from '../../../../src/state/spacing';
import type { Spacing } from '../../../../src/types';

const frame: Spacing = {
  top: 0, left: 0, right: 100, bottom: 100,
};

describe('is visible through frame', () => {
  describe('subject is smaller than frame', () => {
    describe('completely outside frame', () => {
      it('should return false if subject is outside frame on any side', () => {
        const outside: Spacing[] = [
          // outside on top
          offset(frame, { x: 0, y: -101 }),
          // outside on right
          offset(frame, { x: 101, y: 0 }),
          // outside on bottom
          offset(frame, { x: 0, y: 101 }),
          // outside on left
          offset(frame, { x: -101, y: 0 }),
        ];

        outside.forEach((subject: Spacing) => {
          expect(isVisibleThroughFrame(frame)(subject)).toBe(false);
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

        expect(isVisibleThroughFrame(frame)(subject)).toBe(true);
      });
    });

    describe('partially visible', () => {
      it('should return true if partially visible horizontally and vertically', () => {
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

        expect(isVisibleThroughFrame(frame)(subject)).toBe(true);
      });

      it('should return false when only partially visible horizontally', () => {
        const subject: Spacing = {
          // visible
          left: 50,
          // not visible
          top: 110,
          bottom: 150,
          right: 150,
        };

        expect(isVisibleThroughFrame(frame)(subject)).toBe(false);
      });

      it('should return false when only partially visible vertically', () => {
        const subject: Spacing = {
          // visible
          top: 10,
          // not visible
          bottom: 110,
          left: 110,
          right: 150,
        };

        expect(isVisibleThroughFrame(frame)(subject)).toBe(false);
      });
    });
  });

  describe('subject is equal to frame', () => {
    it('should return true when the frame is equal to the subject', () => {
      expect(isVisibleThroughFrame(frame)(frame)).toBe(true);
      expect(isVisibleThroughFrame(frame)({ ...frame })).toBe(true);
    });
  });

  describe('subject is bigger than frame', () => {
    const bigSubject: Spacing = add(frame, frame);

    it('should return false if the subject has no overlap with the frame', () => {
      const subject: Spacing = offset(bigSubject, { x: 1000, y: 1000 });

      expect(isVisibleThroughFrame(frame)(subject)).toBe(false);
    });

    it('should return true if subject is bigger on every side', () => {
      expect(isVisibleThroughFrame(frame)(bigSubject)).toBe(true);
    });

    describe('partially visible', () => {
      it('should return true if partially visible horizontally and vertically on any side', () => {
        // bigger on every edge except one
        const subjects: Spacing[] = [
          // top is not above edge
          { top: 1, left: -100, right: 500, bottom: 500 },
          // left is after edge
          { top: -100, left: 1, right: 500, bottom: 500 },
          // bottom is before edge
          { top: -100, left: -100, right: 500, bottom: 99 },
          // right is before edge
          { top: -100, left: -100, right: 99, bottom: 500 },
        ];

        subjects.forEach((subject: Spacing) => {
          expect(isVisibleThroughFrame(frame)(subject)).toBe(true);
        });
      });

      it('should return false when only partially visible horizontally', () => {
        const subject: Spacing = {
          // not visible
          top: 101,
          bottom: 500,
          // visible
          left: 1,
          right: 500,
        };

        expect(isVisibleThroughFrame(frame)(subject)).toEqual(false);
      });

      it('should return false when only partially visible vertically', () => {
        const subject: Spacing = {
          // visible
          top: 1,
          bottom: 500,
          // not visible
          left: 101,
          right: 500,
        };

        expect(isVisibleThroughFrame(frame)(subject)).toEqual(false);
      });
    });
  });
});
