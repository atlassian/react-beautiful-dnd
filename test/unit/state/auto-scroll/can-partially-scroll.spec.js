// @flow
import type {
  Position,
} from '../../../../src/types';
import { canPartiallyScroll, getRemainder } from '../../../../src/state/auto-scroll/can-partially-scroll';
import { add, subtract } from '../../../../src/state/position';

const origin: Position = { x: 0, y: 0 };

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

  it('should return false if can only scroll in one direction', () => {
    const max: Position = { x: 100, y: 200 };

    type Item = {|
      current: Position,
      change: Position,
    |}

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

      expect(result).toBe(false);
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
  it('should return null if you cannot partially scroll', () => {
    // moving too far back
    const current: Position = origin;
    const max: Position = origin;
    const tooFarBack: Position = { x: 0, y: -1 };

    const result: ?Position = getRemainder({
      current, max, change: tooFarBack,
    });

    expect(result).toBe(null);

    // validating the result

    const validate: boolean = canPartiallyScroll({
      max,
      current,
      change: tooFarBack,
    });

    expect(validate).toBe(false);
  });

  it.only('should return the overlap', () => {
    const max: Position = { x: 100, y: 100 };
    const current: Position = { x: 50, y: 50 };

    type Item = {|
      change: Position,
      expected: Position,
    |}

    const items: Item[] = [
      // too far back: top
      {
        change: { x: -20, y: -70 },
        expected: { x: 0, y: -20 },
      },
      // too far back: left
      {
        change: { x: -70, y: -40 },
        expected: { x: -20, y: 0 },
      },
      // too far forward: right
      {
        change: { x: 70, y: 40 },
        expected: { x: 20, y: 0 },
      },
      // too far forward: bottom
      {
        change: { x: 20, y: 70 },
        expected: { x: 0, y: 20 },
      },

    ];

    items.forEach((item: Item) => {
      const result: ?Position = getRemainder({
        current,
        max,
        change: item.change,
      });

      expect(result).toEqual(item.expected);
    });
  });
});
