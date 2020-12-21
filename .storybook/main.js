module.exports = {
  addons: [
    'storybook-addon-performance/register',
    {
      name: '@storybook/addon-storysource',
      options: {
         sourceLoaderOptions: {
          injectStoryParameters: false,
        },
        loaderOptions: {
          prettierConfig: { printWidth: 80, singleQuote: false },
        },
      },
    },
  ],
};
