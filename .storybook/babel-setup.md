# Babel

storybook looks for a root `.babelrc` in the project for its babel config. However, we are using `.babelrc.js` which is not supported. Rather than putting effort into this we are just having a custom `.babelrc` in this folder which is the same as `.babelrc.js`. This is lame, but we are looking to move away from storybook in the short term anyway.

- [Storybook babel docs](https://storybook.js.org/configurations/custom-babel-config/)
- [Storybook issue for supporting `babelrc.js`](https://github.com/storybooks/storybook/issues/2582)
