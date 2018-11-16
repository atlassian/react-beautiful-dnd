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
  invariant(body instanceof HTMLElement);
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
  });

  afterAll(() => {
    reset(body);
    reset(html);
  });

  it('should mark he body as a scroll container if all criteria are met', () => {
    body.style.overflowX = 'auto';
    html.style.overflowY = 'auto';
    // ensuring body has overflow
    Object.defineProperties(body, {
      scrollHeight: {
        writable: true,
        value: 100,
      },
      clientHeight: {
        writable: true,
        value: 50,
      },
      scrollWidth: {
        writable: true,
        value: 10,
      },
      clientWidth: {
        writable: true,
        value: 10,
      },
    });
    expect(getClosestScrollable(body)).toBe(body);
  });

  it('should not mark the body as a scroll container if it does not have any overflow set', () => {
    body.style.overflowX = 'visible';
    expect(getClosestScrollable(body)).toBe(null);
  });

  it('should not mark the body as a scroll container if the html element has visible overflow', () => {
    body.style.overflowX = 'auto';
    html.style.overflowY = 'visible';
    expect(getClosestScrollable(body)).toBe(null);
  });

  it('should not mark he body as a scroll container if there is no content overflow', () => {
    body.style.overflowX = 'auto';
    html.style.overflowY = 'scroll';
    // no body overflow
    Object.defineProperties(body, {
      scrollHeight: {
        writable: true,
        value: 100,
      },
      clientHeight: {
        writable: true,
        value: 100,
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
    expect(getClosestScrollable(body)).toBe(null);
  });
});
