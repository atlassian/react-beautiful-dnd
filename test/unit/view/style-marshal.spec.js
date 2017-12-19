// @flow
import createStyleMarshal from '../../../src/view/style-marshal/style-marshal';
import getStyles, { type Styles } from '../../../src/view/style-marshal/get-styles';
import type { StyleMarshal } from '../../../src/view/style-marshal/style-marshal-types';
import * as state from '../../utils/simple-state-preset';
import { css } from '../../../src/view/animation';
import type { State } from '../../../src/types';

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

const getStyleFromTag = (context: string): string => {
  const selector: string = getSelectors(context).styleTag;
  const el: HTMLStyleElement = (document.querySelector(selector): any);
  return el.innerHTML;
};

describe('style marshal', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('not dragging', () => {
    it('should apply the resting styles by default', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const styles: Styles = getStyles(marshal.styleContext);
      const active: string = getStyleFromTag(marshal.styleContext);

      expect(active).toEqual(styles.resting);
    });

    it('should apply the resting styles while not dragging', () => {
      [state.idle, state.dropComplete()].forEach((current: State) => {
        const marshal: StyleMarshal = createStyleMarshal();
        const styles: Styles = getStyles(marshal.styleContext);

        marshal.onPhaseChange(current);
        const active: string = getStyleFromTag(marshal.styleContext);

        expect(active).toEqual(styles.resting);
      });
    });
  });

  describe('drag preparing', () => {
    it('should apply the resting styles', () => {
      [state.preparing, state.requesting()].forEach((current: State) => {
        const marshal: StyleMarshal = createStyleMarshal();
        const styles: Styles = getStyles(marshal.styleContext);

        marshal.onPhaseChange(current);
        const active: string = getStyleFromTag(marshal.styleContext);

        expect(active).toEqual(styles.resting);
      });
    });
  });

  describe('dragging', () => {
    it('should apply the dragging styles', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const styles: Styles = getStyles(marshal.styleContext);

      marshal.onPhaseChange(state.dragging());
      const active: string = getStyleFromTag(marshal.styleContext);

      expect(active).toEqual(styles.dragging);
    });
  });

  describe('dropping', () => {
    it('should apply the dropping styles if dropping', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const styles: Styles = getStyles(marshal.styleContext);

      marshal.onPhaseChange(state.dropAnimating());
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.dropping);
    });

    it('should apply the user cancel styles if performing a user directed cancel', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const styles: Styles = getStyles(marshal.styleContext);

      marshal.onPhaseChange(state.userCancel());
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.userCancel);
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
        expect(getStyleFromTag(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));

        // preparing
        marshal.onPhaseChange(state.preparing);
        expect(getStyleFromTag(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // initial dimension request
        marshal.onPhaseChange(state.requesting());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // dragging
        marshal.onPhaseChange(state.dragging());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(getDraggingStyles(marshal.styleContext));

        // dropping
        marshal.onPhaseChange(state.dropAnimating());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));

        // complete
        marshal.onPhaseChange(state.dropComplete());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(getBaseStyles(marshal.styleContext));
      });
    });
  });
});
