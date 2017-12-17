// @flow
import createStyleMarshal from '../../../src/view/style-marshal/style-marshal';
import type { StyleMarshal } from '../../../src/view/style-marshal/style-marshal-types';

const getStyle = (styleTagDataAttribute: string): string => {
  const el: HTMLStyleElement = (document.querySelector(`style[${styleTagDataAttribute}]`): any);
  return el.innerHTML;
};

const getBaseStyle = (draggableClassName: string) => `
  .${draggableClassName} {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    touch-action: manipulation;
  }
`.trim();

describe('style marshal', () => {
  describe('not dragging', () => {
    it('should apply the base styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const style = getStyle(marshal.styleTagDataAttribute);

      expect(style.includes(getBaseStyle(marshal.draggableClassName))).toBe(true);
    });

    it('should not prevent pointer events or add a transition to the draggable', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const style = getStyle(marshal.styleTagDataAttribute);

      expect(style.includes('pointer-events')).toBe(false);
    });
  });

  describe('dragging', () => {
    it('should apply the base styles', () => {

    });

    it('should block pointer events on the draggables', () => {

    });

    it('should transition transforms on the draggables', () => {

    });

    it('should prevent selecting text', () => {

    });

    it('should apply a grabbing cursor to the body', () => {

    });
  });

  describe('dropping', () => {
    it('should remove the dragging styles if a drag is stopped', () => {

    });

    // This will remove pointer-events: none and let the user start dropping other items
    it('should remove the dragging styles if animating a drop', () => {

    });

    describe('animating cancel', () => {
      // we do not allow dragging of other items while animating a cancel
      it('should maintain the dragging styles if animating a cancel', () => {

      });

      it('should clear the dragging style when the animation is finished', () => {

      });

      it('should clear the dragging style when the cancel is flushed at the start of another drag', () => {

      });
    });
  });
});
