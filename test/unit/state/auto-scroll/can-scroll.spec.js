// @flow
import type {
  Position,
  DroppableDimension,
} from '../../../../src/types';
import {
  canPartiallyScroll,
  getOverlap,
  getWindowOverlap,
  getDroppableOverlap,
  canScrollDroppable,
  canScrollWindow,
} from '../../../../src/state/auto-scroller/can-scroll';
import { add, subtract } from '../../../../src/state/position';
import getArea from '../../../../src/state/get-area';
import { getPreset } from '../../../utils/dimension';
import { getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';
import setViewport, { resetViewport } from '../../../utils/set-viewport';
import setWindowScroll, { resetWindowScroll } from '../../../utils/set-window-scroll';
import setWindowScrollSize, { resetWindowScrollSize } from '../../../utils/set-window-scroll-size';

const origin: Position = { x: 0, y: 0 };
const preset = getPreset();

const scrollableScrollSize = {
  scrollWidth: 200,
  scrollHeight: 200,
};

const scrollable: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'drop-1',
    type: 'TYPE',
  },
  client: getArea({
    top: 0,
    left: 0,
    right: 100,
    // bigger than the frame
    bottom: 200,
  }),
  closest: {
    frameClient: getArea({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    }),
    scrollWidth: scrollableScrollSize.scrollWidth,
    scrollHeight: scrollableScrollSize.scrollHeight,
    scroll: { x: 0, y: 0 },
    shouldClipSubject: true,
  },
});

describe('can scroll', () => {
  afterEach(() => {
    resetViewport();
    resetWindowScroll();
    resetWindowScrollSize();
  });

  describe('can partially scroll', () => {
    it('should return true if not scrolling anywhere', () => {
      const result: boolean = canPartiallyScroll({
        max: { x: 100, y: 100 },
        current: { x: 0, y: 0 },
        // not
        change: origin,
      });

      expect(result).toBe(true);
    });

    it('should return true if scrolling to a boundary', () => {
      const current: Position = origin;
      const max: Position = { x: 100, y: 200 };

      const corners: Position[] = [
      // top left
        { x: 0, y: 0 },
        // top right
        { x: max.x, y: 0 },
        // bottom right
        { x: max.x, y: max.y },
        // bottom left
        { x: 0, y: max.y },
      ];

      corners.forEach((corner: Position) => {
        const result: boolean = canPartiallyScroll({
          max,
          current,
          change: corner,
        });

        expect(result).toBe(true);
      });
    });

    it('should return true if moving in any direction within the allowable scroll region', () => {
      const max: Position = { x: 100, y: 100 };
      const current: Position = { x: 50, y: 50 };

      // all of these movements are totally possible
      const changes: Position[] = [
      // top left
        { x: -10, y: 10 },
        // top right
        { x: 10, y: 10 },
        // bottom right
        { x: 10, y: -10 },
        // bottom left
        { x: -10, y: -10 },
      ];

      changes.forEach((point: Position) => {
        const result: boolean = canPartiallyScroll({
          max,
          current,
          change: point,
        });

        expect(result).toBe(true);
      });
    });

    it('should return true if able to partially move in both directions', () => {
      const max: Position = { x: 100, y: 100 };
      const current: Position = { x: 50, y: 50 };

      // all of these movements are partially possible
      const changes: Position[] = [
      // top left
        { x: -200, y: 200 },
        // top right
        { x: 200, y: 200 },
        // bottom right
        { x: 200, y: -200 },
        // bottom left
        { x: -200, y: -200 },
      ];

      changes.forEach((point: Position) => {
        const result: boolean = canPartiallyScroll({
          max,
          current,
          change: point,
        });

        expect(result).toBe(true);
      });
    });

    type Item = {|
      current: Position,
      change: Position,
    |}

    it('should return true if can only partially move in one direction', () => {
      const max: Position = { x: 100, y: 200 };

      const changes: Item[] = [
        // Can move back in the y direction, but not back in the x direction
        {
          current: { x: 0, y: 1 },
          change: { x: -1, y: -1 },
        },
        // Can move back in the x direction, but not back in the y direction
        {
          current: { x: 1, y: 0 },
          change: { x: -1, y: -1 },
        },
        // Can move forward in the y direction, but not forward in the x direction
        {
          current: subtract(max, { x: 0, y: 1 }),
          change: { x: 1, y: 1 },
        },
        // Can move forward in the x direction, but not forward in the y direction
        {
          current: subtract(max, { x: 1, y: 0 }),
          change: { x: 1, y: 1 },
        },
      ];

      changes.forEach((item: Item) => {
        const result: boolean = canPartiallyScroll({
          max,
          current: item.current,
          change: item.change,
        });

        expect(result).toBe(true);
      });
    });

    it('should return false if on the min point and move backward in any direction', () => {
      const current: Position = origin;
      const max: Position = { x: 100, y: 200 };
      const tooFarBack: Position[] = [
        { x: 0, y: -1 },
        { x: -1, y: 0 },
      ];

      tooFarBack.forEach((point: Position) => {
        const result: boolean = canPartiallyScroll({
          max,
          current,
          change: point,
        });

        expect(result).toBe(false);
      });
    });

    it('should return false if on the max point and move forward in any direction', () => {
      const max: Position = { x: 100, y: 200 };
      const current: Position = max;
      const tooFarForward: Position[] = [
        add(max, { x: 0, y: 1 }),
        add(max, { x: 1, y: 0 }),
      ];

      tooFarForward.forEach((point: Position) => {
        const result: boolean = canPartiallyScroll({
          max,
          current,
          change: point,
        });

        expect(result).toBe(false);
      });
    });
  });

  describe('get overlap', () => {
    describe('returning the remainder', () => {
      const max: Position = { x: 100, y: 100 };
      const current: Position = { x: 50, y: 50 };

    type Item = {|
      change: Position,
      expected: Position,
    |}

    it('should return overlap on a single axis', () => {
      const items: Item[] = [
        // too far back: top
        {
          change: { x: 0, y: -70 },
          expected: { x: 0, y: -20 },
        },
        // too far back: left
        {
          change: { x: -70, y: 0 },
          expected: { x: -20, y: 0 },
        },
        // too far forward: right
        {
          change: { x: 70, y: 0 },
          expected: { x: 20, y: 0 },
        },
        // too far forward: bottom
        {
          change: { x: 0, y: 70 },
          expected: { x: 0, y: 20 },
        },
      ];

      items.forEach((item: Item) => {
        const result: ?Position = getOverlap({
          current,
          max,
          change: item.change,
        });

        expect(result).toEqual(item.expected);
      });
    });

    it('should return overlap on two axis in the same direction', () => {
      const items: Item[] = [
        // too far back: top
        {
          change: { x: -80, y: -70 },
          expected: { x: -30, y: -20 },
        },
        // too far back: left
        {
          change: { x: -70, y: -80 },
          expected: { x: -20, y: -30 },
        },
        // too far forward: right
        {
          change: { x: 70, y: 0 },
          expected: { x: 20, y: 0 },
        },
        // too far forward: bottom
        {
          change: { x: 80, y: 70 },
          expected: { x: 30, y: 20 },
        },
      ];

      items.forEach((item: Item) => {
        const result: ?Position = getOverlap({
          current,
          max,
          change: item.change,
        });

        expect(result).toEqual(item.expected);
      });
    });

    it('should return overlap on two axis in different directions', () => {
      const items: Item[] = [
        // too far back: vertical
        // too far forward: horizontal
        {
          change: { x: 80, y: -70 },
          expected: { x: 30, y: -20 },
        },
        // too far back: horizontal
        // too far forward: vertical
        {
          change: { x: -70, y: 80 },
          expected: { x: -20, y: 30 },
        },
      ];

      items.forEach((item: Item) => {
        const result: ?Position = getOverlap({
          current,
          max,
          change: item.change,
        });

        expect(result).toEqual(item.expected);
      });
    });

    it('should trim values that can be scrolled', () => {
      const items: Item[] = [
        // too far back: top
        {
          // x can be scrolled entirely
          // y can be partially scrolled
          change: { x: -20, y: -70 },
          expected: { x: 0, y: -20 },
        },
        // too far back: left
        {
          // x can be partially scrolled
          // y can be scrolled entirely
          change: { x: -70, y: -40 },
          expected: { x: -20, y: 0 },
        },
        // too far forward: right
        {
          // x can be partially scrolled
          // y can be scrolled entirely
          change: { x: 70, y: 40 },
          expected: { x: 20, y: 0 },
        },
        // too far forward: bottom
        {
          // x can be scrolled entirely
          // y can be partially scrolled
          change: { x: 20, y: 70 },
          expected: { x: 0, y: 20 },
        },

      ];

      items.forEach((item: Item) => {
        const result: ?Position = getOverlap({
          current,
          max,
          change: item.change,
        });

        expect(result).toEqual(item.expected);
      });
    });
    });
  });

  describe('can scroll droppable', () => {
    it('should return false if the droppable is not scrollable', () => {
      const result: boolean = canScrollDroppable(preset.home, { x: 1, y: 1 });

      expect(result).toBe(false);
    });

    it('should return true if the droppable is able to be scrolled', () => {
      const result: boolean = canScrollDroppable(scrollable, { x: 0, y: 20 });

      expect(result).toBe(true);
    });

    it('should return false if the droppable is not able to be scrolled', () => {
      const result: boolean = canScrollDroppable(scrollable, { x: -1, y: 0 });

      expect(result).toBe(false);
    });
  });

  describe('can scroll window', () => {
    it('should return true if the window is able to be scrolled', () => {
      setViewport(getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }));
      setWindowScrollSize({
        scrollHeight: 200,
        scrollWidth: 100,
      });
      setWindowScroll(origin);

      const result: boolean = canScrollWindow({ x: 0, y: 50 });

      expect(result).toBe(true);
    });

    it('should return false if the window is not able to be scrolled', () => {
      setViewport(getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }));
      setWindowScrollSize({
        scrollHeight: 200,
        scrollWidth: 100,
      });
      // already at the max scroll
      setWindowScroll({
        x: 0,
        y: 200,
      });

      const result: boolean = canScrollWindow({ x: 0, y: 1 });

      expect(result).toBe(false);
    });
  });

  describe('get droppable overlap', () => {
    it('should return null if there is no scroll container', () => {
      const result: ?Position = getDroppableOverlap(preset.home, { x: 1, y: 1 });

      expect(result).toBe(null);
    });

    it('should return null if the droppable cannot be scrolled', () => {
      // end of the scrollable area
      const scroll: Position = {
        x: 0,
        y: 200,
      };
      const scrolled: DroppableDimension = scrollDroppable(scrollable, scroll);
      const result: ?Position = getDroppableOverlap(scrolled, { x: 0, y: 1 });

      expect(result).toBe(null);
    });

    // tested in get remainder
    it('should return the overlap', () => {
      // how far the droppable has already
      const scroll: Position = {
        x: 10, y: 20,
      };
      const scrolled: DroppableDimension = scrollDroppable(scrollable, scroll);
      // $ExpectError - not checking for null
      const max: Position = scrolled.viewport.closestScrollable.scroll.max;
      const totalSpace: Position = {
        x: scrollableScrollSize.scrollWidth - max.x,
        y: scrollableScrollSize.scrollHeight - max.y,
      };
      const remainingSpace = subtract(totalSpace, scroll);
      const change: Position = { x: 300, y: 300 };
      const expectedOverlap: Position = subtract(change, remainingSpace);

      const result: ?Position = getDroppableOverlap(scrolled, change);

      expect(result).toEqual(expectedOverlap);
    });

    it('should return null if there is no overlap', () => {
      const change: Position = { x: 0, y: 1 };

      const result: ?Position = getDroppableOverlap(scrollable, change);

      expect(result).toEqual(null);

      // verifying correctness of test

      expect(canScrollDroppable(scrollable, change)).toBe(true);
    });
  });

  describe('get window overlap', () => {
    it('should return null if the window cannot be scrolled', () => {
      setViewport(getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }));
      setWindowScrollSize({
        scrollHeight: 200,
        scrollWidth: 100,
      });
      // already at the max scroll
      setWindowScroll({
        x: 0,
        y: 200,
      });

      const result: ?Position = getWindowOverlap({ x: 0, y: 1 });

      expect(result).toBe(null);
    });

    // tested in get remainder
    it('should return the overlap', () => {
      setViewport(getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }));
      const windowScrollSize = {
        scrollHeight: 200,
        scrollWidth: 100,
      };
      setWindowScrollSize(windowScrollSize);
      const windowScroll: Position = {
        x: 50,
        y: 50,
      };
      setWindowScroll(windowScroll);
      const change: Position = { x: 300, y: 300 };
      const space: Position = {
        x: windowScrollSize.scrollWidth - windowScroll.x,
        y: windowScrollSize.scrollHeight - windowScroll.y,
      };
      const overlap: Position = subtract(change, space);

      const result: ?Position = getWindowOverlap(change);

      expect(result).toEqual(overlap);
    });

    it('should return null if there is no overlap', () => {
      setViewport(getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }));
      const scrollSize = {
        scrollHeight: 200,
        scrollWidth: 100,
      };
      setWindowScrollSize(scrollSize);
      setWindowScroll(origin);

      const result: ?Position = getWindowOverlap({ x: 10, y: 10 });

      expect(result).toBe(null);
    });
  });
});
