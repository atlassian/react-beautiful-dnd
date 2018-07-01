// @flow
import createStyleMarshal, {
  resetStyleContext,
} from '../../../src/view/style-marshal/style-marshal';
import getStyles, {
  type Styles,
} from '../../../src/view/style-marshal/get-styles';
import { prefix } from '../../../src/view/data-attributes';
import type { StyleMarshal } from '../../../src/view/style-marshal/style-marshal-types';

const getStyleTagSelector = (context: string) =>
  `style[${prefix}="${context}"]`;

const getStyleFromTag = (context: string): string => {
  const selector: string = getStyleTagSelector(context);
  const el: HTMLStyleElement = (document.querySelector(selector): any);
  return el.innerHTML;
};

describe('style marshal', () => {
  let marshal: StyleMarshal;
  let styles: Styles;
  beforeEach(() => {
    resetStyleContext();
    marshal = createStyleMarshal();
    styles = getStyles(marshal.styleContext);
  });

  afterEach(() => {
    try {
      marshal.unmount();
    } catch (e) {
      // already unmounted
    }
  });

  it('should not mount a style tag until mounted', () => {
    const selector: string = getStyleTagSelector(marshal.styleContext);

    // initially there is no style tag
    expect(document.querySelector(selector)).toBeFalsy();

    // now mounting
    marshal.mount();
    expect(document.querySelector(selector)).toBeInstanceOf(HTMLStyleElement);
  });

  it('should throw if mounting after already mounting', () => {
    marshal.mount();

    expect(() => marshal.mount()).toThrow();
  });

  it('should apply the resting styles by default', () => {
    marshal.mount();
    const active: string = getStyleFromTag(marshal.styleContext);

    expect(active).toEqual(styles.resting);
  });

  it('should apply the resting styles when asked', () => {
    marshal.mount();

    marshal.resting();
    const active: string = getStyleFromTag(marshal.styleContext);

    expect(active).toEqual(styles.resting);
  });

  it('should apply the collecting styles when asked', () => {
    marshal.mount();

    marshal.collecting();
    const active: string = getStyleFromTag(marshal.styleContext);

    expect(active).toEqual(styles.collecting);
  });

  it('should apply the dragging styles when asked', () => {
    marshal.mount();

    marshal.dragging();
    const active: string = getStyleFromTag(marshal.styleContext);

    expect(active).toEqual(styles.dragging);
  });

  it('should apply the drop animating styles when asked', () => {
    marshal.mount();

    marshal.dropping('DROP');
    const active: string = getStyleFromTag(marshal.styleContext);

    expect(active).toEqual(styles.dropAnimating);
  });

  it('should apply the user cancel styles when asked', () => {
    marshal.mount();

    marshal.dropping('CANCEL');
    const active: string = getStyleFromTag(marshal.styleContext);

    expect(active).toEqual(styles.userCancel);
  });

  it('should remove the style tag from the head when unmounting', () => {
    marshal.mount();
    const selector: string = getStyleTagSelector(marshal.styleContext);

    // the style tag exists
    expect(document.querySelector(selector)).toBeTruthy();

    // now unmounted
    marshal.unmount();

    expect(document.querySelector(selector)).not.toBeTruthy();
  });

  it('should log an error if attempting to apply styles after unmounted', () => {
    marshal.mount();
    const selector: string = getStyleTagSelector(marshal.styleContext);
    // grabbing the element before unmount
    const el: HTMLElement = (document.querySelector(selector): any);

    // asserting it has the base styles
    expect(el.innerHTML).toEqual(styles.resting);

    marshal.unmount();

    expect(() => marshal.dragging()).toThrow();
  });

  it('should allow subsequent updates', () => {
    marshal.mount();

    Array.from({ length: 4 }).forEach(() => {
      marshal.resting();
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.resting);

      marshal.dragging();
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.dragging);

      marshal.collecting();
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.collecting);

      marshal.dropping('DROP');
      expect(getStyleFromTag(marshal.styleContext)).toEqual(
        styles.dropAnimating,
      );
    });
  });

  describe('resetStyleContext', () => {
    it('should reset the style context counter for subsequent marshals', () => {
      // initial marshal
      marshal.mount();
      // initial style context
      expect(marshal.styleContext).toBe('0');

      // creating second marshal
      const marshalBeforeReset = createStyleMarshal();
      expect(marshalBeforeReset.styleContext).toBe('1');

      resetStyleContext();

      // creating third marshal after reset
      const marshalAfterReset = createStyleMarshal();
      expect(marshalAfterReset.styleContext).toBe('0');
    });
  });
});
