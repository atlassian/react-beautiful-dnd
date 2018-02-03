// @flow
import createStyleMarshal from '../../../src/view/style-marshal/style-marshal';
import getStyles, { type Styles } from '../../../src/view/style-marshal/get-styles';
import type { StyleMarshal } from '../../../src/view/style-marshal/style-marshal-types';
import * as state from '../../utils/simple-state-preset';
import type { State } from '../../../src/types';

const getStyleTagSelector = (context: string) =>
  `style[data-react-beautiful-dnd="${context}"]`;

const getStyleFromTag = (context: string): string => {
  const selector: string = getStyleTagSelector(context);
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
    it('should not mount a style tag until mounted', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const selector: string = getStyleTagSelector(marshal.styleContext);

      // initially there is no style tag
      expect(document.querySelector(selector)).toBeFalsy();

      // now mounting
      marshal.mount();
      expect(document.querySelector(selector)).toBeInstanceOf(HTMLStyleElement);
    });

    it('should log an error if mounting after already mounting', () => {
      const marshal: StyleMarshal = createStyleMarshal();

      marshal.mount();
      expect(console.error).not.toHaveBeenCalled();

      marshal.mount();
      expect(console.error).toHaveBeenCalled();
    });

    it('should apply the resting styles by default', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      const styles: Styles = getStyles(marshal.styleContext);
      marshal.mount();
      const active: string = getStyleFromTag(marshal.styleContext);

      expect(active).toEqual(styles.resting);
    });

    it('should apply the resting styles while not dragging', () => {
      [state.idle, state.dropComplete()].forEach((current: State) => {
        const marshal: StyleMarshal = createStyleMarshal();
        marshal.mount();
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
        marshal.mount();
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
      marshal.mount();
      const styles: Styles = getStyles(marshal.styleContext);

      marshal.onPhaseChange(state.dragging());
      const active: string = getStyleFromTag(marshal.styleContext);

      expect(active).toEqual(styles.dragging);
    });
  });

  describe('dropping', () => {
    it('should apply the dropping styles if dropping', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      marshal.mount();
      const styles: Styles = getStyles(marshal.styleContext);

      marshal.onPhaseChange(state.dropAnimating());
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.dropAnimating);
    });

    it('should apply the user cancel styles if performing a user directed cancel', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      marshal.mount();
      const styles: Styles = getStyles(marshal.styleContext);

      marshal.onPhaseChange(state.userCancel());
      expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.userCancel);
    });
  });

  describe('unmounting', () => {
    it('should remove the style tag from the head when unmounting', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      marshal.mount();
      const selector: string = getStyleTagSelector(marshal.styleContext);

      // the style tag exists
      expect(document.querySelector(selector)).toBeTruthy();

      // now unmounted
      marshal.unmount();

      expect(document.querySelector(selector)).not.toBeTruthy();
    });

    it('should log an error if attempting to apply styles after unmounted', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      marshal.mount();
      const styles: Styles = getStyles(marshal.styleContext);
      const selector: string = getStyleTagSelector(marshal.styleContext);
      // grabbing the element before unmount
      const el: HTMLElement = (document.querySelector(selector): any);

      // asserting it has the base styles
      expect(el.innerHTML).toEqual(styles.resting);

      marshal.unmount();
      marshal.onPhaseChange(state.dragging());

      // asserting it has the base styles (not updated)
      expect(el.innerHTML).toEqual(styles.resting);
      // an error is logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('subsequent updates', () => {
    it('should allow multiple updates', () => {
      const marshal: StyleMarshal = createStyleMarshal();
      marshal.mount();
      const styles: Styles = getStyles(marshal.styleContext);

      Array.from({ length: 4 }).forEach(() => {
        // idle
        marshal.onPhaseChange(state.idle);
        expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.resting);

        // preparing
        marshal.onPhaseChange(state.preparing);
        expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.resting);

        // initial dimension request
        marshal.onPhaseChange(state.requesting());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.resting);

        // dragging
        marshal.onPhaseChange(state.dragging());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.dragging);

        // dropping
        marshal.onPhaseChange(state.dropAnimating());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.dropAnimating);

        // complete
        marshal.onPhaseChange(state.dropComplete());
        expect(getStyleFromTag(marshal.styleContext)).toEqual(styles.resting);
      });
    });
  });
});
