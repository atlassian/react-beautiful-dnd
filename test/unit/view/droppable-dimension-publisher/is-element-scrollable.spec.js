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

it('should return false if an element has overflow:visible', () => {
  ['overflowY', 'overflowX'].forEach((overflow: string) => {
    const el: HTMLElement = document.createElement('div');
    // $ExpectError - flow being mean
    el.style[overflow] = 'visible';
    expect(getClosestScrollable(el)).toBe(null);
  });
});

describe('body detection', () => {
  // The `body` is considered a scroll container when:
  // 1. The `body` has `overflow-[x|y]: auto | scroll` AND
  // 2. The parent of `body` (`html`) has an `overflow-[x|y]` set to anything except `visible` AND
  // 3. There is a current overflow in the `body`
  const body: ?Element = document.body;
  invariant(body);
  invariant(body instanceof HTMLBodyElement);
  const html: ?Element = body.parentElement;
  invariant(html);
  invariant(html === document.documentElement);
  invariant(html instanceof HTMLElement);

  const reset = (el: Element) => {
    invariant(el instanceof HTMLElement);
    el.style.overflowX = 'visible';
    el.style.overflowY = 'visible';
  };

  beforeEach(() => {
    reset(body);
    reset(html);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockReset();
  });

  afterAll(() => {
    reset(body);
    reset(html);
  });

  it('should warn if the body might be a scroll container', () => {
    body.style.overflowX = 'auto';
    html.style.overflowY = 'auto';

    expect(getClosestScrollable(body)).toBe(null);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should not mark the body as a scroll container if it does not have any overflow set', () => {
    body.style.overflowX = 'visible';
    expect(getClosestScrollable(body)).toBe(null);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should not mark the body as a scroll container if the html element has visible overflow', () => {
    body.style.overflowX = 'auto';
    html.style.overflowY = 'visible';
    expect(getClosestScrollable(body)).toBe(null);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
