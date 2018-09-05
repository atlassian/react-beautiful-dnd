// @flow
import stylelint from 'stylelint';
import getStyles, {
  type Styles,
} from '../../../../src/view/style-marshal/get-styles';

const styles: Styles = getStyles('hey');

Object.keys(styles).forEach((key: string) => {
  it(`should generate valid ${key} styles`, () =>
    stylelint
      .lint({
        code: styles[key],
        config: {
          // just using the recommended config as it only checks for errors and not formatting
          extends: ['stylelint-config-recommended'],
          // basic semi colin rules
          rules: {
            'no-extra-semicolons': true,
            'declaration-block-semicolon-space-after': 'always-single-line',
          },
        },
      })
      .then(result => {
        expect(result.errored).toBe(false);
        // asserting that some CSS was actually generated!
        // eslint-disable-next-line no-underscore-dangle
        expect(result.results[0]._postcssResult.css.length).toBeGreaterThan(1);
      }));
});
