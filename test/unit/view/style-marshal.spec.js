// @flow
import createStyleMarshal from '../../../src/view/style-marshal/style-marshal';
import type { StyleMarshal } from '../../../src/view/style-marshal/style-marshal-types';
import * as state from '../../utils/simple-state-preset';
import { css } from '../../../src/view/animation';

const getSelectors = (context: string) => {
  const prefix: string = 'data-react-beautiful-dnd';
  const dragHandle: string = `[${prefix}-drag-handle="${context}"]`;
  const draggable: string = `[${prefix}-draggable="${context}"]`;
  const styleTag: string = `style[data-react-beautiful-dnd="${context}"]`;

  return {
    styleTag,
    dragHandle,
    draggable,
  };
};

// Obtain consistent white spacing
// 1. replace any whitespace greater than two characters with a single whitespace
// 2. trim any wrapping whitespace
const clean = (value: string): string =>
  value.replace(/\s{2,}/g, ' ').trim();

const getStyle = (context: string): string => {
  const selector: string = getSelectors(context).styleTag;
  const el: HTMLStyleElement = (document.querySelector(selector): any);
  return clean(el.innerHTML);
};

const getBaseStyles = (context: string) => clean(`
  ${getSelectors(context).dragHandle} {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    touch-action: manipulation;
    cursor: -webkit-grab;
    cursor: grab;
  }
`);

const getDraggingStyles = (context: string) => clean(`
  body {
    cursor: grabbing;
    cursor: -webkit-grabbing;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  ${getBaseStyles(context)}

  ${getSelectors(context).dragHandle} {
    pointer-events: none;
  }

  ${getSelectors(context).draggable} {
    transition: ${css.outOfTheWay};
  }
`);

describe('style marshal', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('not dragging', () => {
    it('should apply the base drag handle styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const style: string = getStyle(marshal.styleContext);

      expect(style).toEqual(getBaseStyles(marshal.styleContext));
    });
  });

  describe('drag preparing', () => {
    it('should apply the dragging styles while flushing the last drag', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      marshal.onPhaseChange(state.preparing);
      const style: string = getStyle(marshal.styleContext);

      expect(style).toEqual(getDraggingStyles(marshal.styleContext));
    });

    it('should apply the dragging styles while requesting initial dimensions', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      marshal.onPhaseChange(state.requesting());
      const style: string = getStyle(marshal.styleContext);

      expect(style).toEqual(getDraggingStyles(marshal.styleContext));
    });
  });

  describe('drag starting', () => {
    it('should apply the dragging styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      marshal.onPhaseChange(state.dragging());
      const style: string = getStyle(marshal.styleContext);

      expect(style).toEqual(getDraggingStyles(marshal.styleContext));
    });
  });

  describe('cancelled by error', () => {
    it('should revert to the base styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      // initial drag
      marshal.onPhaseChange(state.dragging());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // cancelled by error
      marshal.onPhaseChange(state.idle);
      expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
    });
  });

  describe('user directed cancel', () => {
    it('should maintain the dragging styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      // initial drag
      marshal.onPhaseChange(state.dragging());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // cancelled
      marshal.onPhaseChange(state.userCancel());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));
    });

    it('should clear the style once the drop is complete', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      // initial drag
      marshal.onPhaseChange(state.dragging());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // cancelled
      marshal.onPhaseChange(state.userCancel());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // drop complete
      marshal.onPhaseChange(state.dropComplete());
      expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
    });

    it('should clear the style if there is an error while cancelling', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      // initial drag
      marshal.onPhaseChange(state.dragging());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // user cancel
      marshal.onPhaseChange(state.userCancel());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // some error causes the drop to be abandoned
      marshal.onPhaseChange(state.idle);
      expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
    });
  });

  describe('dropping', () => {
    it('should revert to the base styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      // initial drag
      marshal.onPhaseChange(state.dragging());
      expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

      // dropping
      marshal.onPhaseChange(state.dropAnimating());
      expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
    });
  });

  describe('unmounting', () => {
    it('should remove the style tag from the head when unmounting', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const selector: string = getSelectors(marshal.styleContext).styleTag;

      // the style tag exists
      expect(document.querySelector(selector)).toBeTruthy();

      // now unmounted
      marshal.unmount();

      expect(document.querySelector(selector)).not.toBeTruthy();
    });

    it('should log an error if attempting to apply styles after unmounted', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const selector: string = getSelectors(marshal.styleContext).styleTag;
      // grabbing the element before unmount
      const el: HTMLElement = (document.querySelector(selector): any);
      // asserting it has the base styles
      expect(clean(el.innerHTML)).toEqual(getBaseStyles(marshal.styleContext));

      marshal.unmount();
      marshal.onPhaseChange(state.dragging());

      // asserting it has the base styles (not updated)
      expect(clean(el.innerHTML)).toEqual(getBaseStyles(marshal.styleContext));
      // an error is logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('subsequent updates', () => {
    it('should allow multiple updates', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      Array.from({ length: 4 }).forEach(() => {
        // idle
        marshal.onPhaseChange(state.idle);
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));

        // preparing
        marshal.onPhaseChange(state.preparing);
        expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // initial dimension request
        marshal.onPhaseChange(state.requesting());
        expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // dragging
        marshal.onPhaseChange(state.dragging());
        expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // dropping
        marshal.onPhaseChange(state.dropAnimating());
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));

        // complete
        marshal.onPhaseChange(state.dropComplete());
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
      });
    });

    it('should allow multiple updates after a cancel', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      Array.from({ length: 4 }).forEach(() => {
        // requesting
        marshal.onPhaseChange(state.idle);
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));

        // dragging
        marshal.onPhaseChange(state.dragging());
        expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // cancelling
        marshal.onPhaseChange(state.userCancel());
        expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // complete
        marshal.onPhaseChange(state.dropComplete());
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
      });
    });

    it('should allow multiple updates after an error', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      Array.from({ length: 4 }).forEach(() => {
        // idle
        marshal.onPhaseChange(state.idle);
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));

        // dragging
        marshal.onPhaseChange(state.dragging());
        expect(getStyle(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // error
        marshal.onPhaseChange(state.idle);
        expect(getStyle(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
      });
    });
  });
});
