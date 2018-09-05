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
        configOverrides: {
          // we merge all the styles into a fairly compressed block
          rules: {
            'no-missing-end-of-source-newline': null,
          },
        },
      })
      .then(result => {
        expect(result.errored).toBe(false);
      }));
});
