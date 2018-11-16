// @flow
import invariant from 'tiny-invariant';
import getClosestScrollable from '../../../../src/view/droppable-dimension-publisher/get-closest-scrollable';

it('should return true if an element has overflow:auto or overflow:scroll', () => {
  ['overflowY', 'overflowX'].forEach((overflow: string) => {
    ['auto', 'scroll'].forEach((value: string) => {
      const el: HTMLElement = document.createElement('div');
      // $ExpectError - flow being mean
      el.style[overflow] = value;
      expect(getClosestScrollable(el)).toBe(el);
    });
  });
});

it('should return true if an element has overflow:visible', () => {
  ['overflowY', 'overflowX'].forEach((overflow: string) => {
    const el: HTMLElement = document.createElement('div');
    // $ExpectError - flow being mean
    el.style[overflow] = 'visible';
    expect(getClosestScrollable(el)).toBe(null);
  });
});

it('should return false if the body or document.documentElement are provided', () => {
  invariant(document.body);
  document.body.style.overflowX = 'scroll';

  invariant(document.documentElement);
  document.documentElement.style.overflowY = 'scroll';

  expect(getClosestScrollable(document.body)).toBe(null);
  expect(getClosestScrollable(document.documentElement)).toBe(null);
});

describe('overflow hidden', () => {
  it('should return false if overflow:hidden on both the X and Y', () => {
    const el: HTMLElement = document.createElement('div');
    el.style.overflowX = 'hidden';
    el.style.overflowY = 'hidden';

    expect(getClosestScrollable(el)).toBe(null);
  });

  it('should return true if overflow:scroll on one axis', () => {
    // vertical
    {
      const el: HTMLElement = document.createElement('div');
      el.style.overflowX = 'hidden';
      el.style.overflowY = 'scroll';

      expect(getClosestScrollable(el)).toBe(el);
    }
    // horizontal
    {
      const el: HTMLElement = document.createElement('div');
      el.style.overflowX = 'scroll';
      el.style.overflowY = 'hidden';

      expect(getClosestScrollable(el)).toBe(el);
    }
  });

  it('should return true if there is overflow scroll (and log a warning)', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // vertical
    {
      const el: HTMLElement = document.createElement('div');
      el.style.overflowX = 'hidden';
      // this is what the computed value would be
      el.style.overflowY = 'auto';

      // there is a scrollable area
      Object.defineProperties(el, {
        scrollHeight: {
          writable: true,
          value: 100,
        },
        clientHeight: {
          writable: true,
          value: 50,
        },
        // don't care about these ones
        scrollWidth: {
          writable: true,
          value: 10,
        },
        clientWidth: {
          writable: true,
          value: 10,
        },
      });

      expect(getClosestScrollable(el)).toBe(el);
      expect(console.warn).toHaveBeenCalled();
    }
    // horizontal
    {
      console.warn.mockClear();
      const el: HTMLElement = document.createElement('div');
      el.style.overflowX = 'hidden';
      // this is what the computed value would be
      el.style.overflowY = 'auto';

      // there is a scrollable area
      Object.defineProperties(el, {
        scrollWidth: {
          writable: true,
          value: 100,
        },
        clientWidth: {
          writable: true,
          value: 50,
        },
        // don't care about these ones
        scrollHeight: {
          writable: true,
          value: 10,
        },
        clientHeight: {
          writable: true,
          value: 10,
        },
      });

      expect(getClosestScrollable(el)).toBe(el);
      expect(console.warn).toHaveBeenCalled();
    }
    console.warn.mockReset();
  });

  it('should return false if there is no overflow scroll (and log a warning)', () => {
    jest.spyOn(console, 'warn');
    // vertical
    {
      const el: HTMLElement = document.createElement('div');
      el.style.overflowX = 'hidden';
      // this is what the computed value would be
      el.style.overflowY = 'auto';

      // there is a scrollable area
      Object.defineProperties(el, {
        scrollHeight: {
          writable: true,
          value: 100,
        },
        clientHeight: {
          writable: true,
          value: 100,
        },
        scrollWidth: {
          writable: true,
          value: 100,
        },
        clientWidth: {
          writable: true,
          value: 100,
        },
      });

      expect(getClosestScrollable(el)).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    }
    // horizontal
    {
      console.warn.mockClear();
      const el: HTMLElement = document.createElement('div');
      el.style.overflowY = 'hidden';
      // this is what the computed value would be
      el.style.overflowX = 'auto';

      // there is a scrollable area
      Object.defineProperties(el, {
        scrollWidth: {
          writable: true,
          value: 100,
        },
        clientWidth: {
          writable: true,
          value: 100,
        },
        scrollHeight: {
          writable: true,
          value: 100,
        },
        clientHeight: {
          writable: true,
          value: 100,
        },
      });

      expect(getClosestScrollable(el)).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    }
    console.warn.mockReset();
  });
});

type OverflowValue = 'visible' | 'scroll' | 'auto' | 'hidden';
type Case = {|
  overflowX: OverflowValue,
  overflowY: OverflowValue,
  isScrollContainer: boolean,
  canDetectSafely: boolean,
|};

describe('conditional fallback', () => {
  // designed to match grid in `docs/guides/how-we-detect-scroll-containers.md`
  const No: boolean = false;
  const Yes: boolean = true;
  // prettier-ignore
  const cases: Case[] = [
    { overflowX: 'visible', overflowY: 'visible', isScrollContainer: No, canDetectSafely: Yes, },
    { overflowX: 'visible', overflowY: 'auto', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'visible', overflowY: 'scroll', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'visible', overflowY: 'hidden', isScrollContainer: No, canDetectSafely: No, },
    { overflowX: 'auto', overflowY: 'visible', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'auto', overflowY: 'auto', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'auto', overflowY: 'scroll', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'auto', overflowY: 'hidden', isScrollContainer: Yes, canDetectSafely: No, },
    { overflowX: 'scroll', overflowY: 'visible', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'scroll', overflowY: 'auto', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'scroll', overflowY: 'scroll', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'scroll', overflowY: 'hidden', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'hidden', overflowY: 'visible', isScrollContainer: No, canDetectSafely: No, },
    { overflowX: 'hidden', overflowY: 'auto', isScrollContainer: Yes, canDetectSafely: No, },
    { overflowX: 'hidden', overflowY: 'scroll', isScrollContainer: Yes, canDetectSafely: Yes, },
    { overflowX: 'hidden', overflowY: 'hidden', isScrollContainer: No, canDetectSafely: Yes, },
  ];

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockReset();
  });

  cases.forEach((current: Case) => {
    it(`overflow-x:${current.overflowX} overflow-y:${
      current.overflowY
    }`, () => {
      const el: HTMLElement = document.createElement('div');
      el.style.overflowY = current.overflowY;
      el.style.overflowX = current.overflowX;

      // need to setup a scroll container for detection if needed
      if (!current.canDetectSafely && current.isScrollContainer) {
        // there is a scrollable area
        Object.defineProperties(el, {
          scrollWidth: {
            writable: true,
            value: 200,
          },
          clientWidth: {
            writable: true,
            value: 100,
          },
          scrollHeight: {
            writable: true,
            value: 200,
          },
          clientHeight: {
            writable: true,
            value: 100,
          },
        });
      }

      expect(getClosestScrollable(el)).toBe(
        current.isScrollContainer ? el : null,
      );

      expect(console.warn).toHaveBeenCalledTimes(
        current.canDetectSafely ? 0 : 1,
      );
    });
  });
});
