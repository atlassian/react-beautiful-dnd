// @flow
module.exports = {
  siteMetadata: {
    isDevelopment: process.env.NODE_ENV === 'development',
  },
  plugins: [
    'gatsby-plugin-sharp',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'src',
        path: `${__dirname}/documentation/`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-unwrap-images`,
          // I think this only work for local images and not hosted.
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 740,
              wrapperStyle: `margin: 32px 0;`,
            },
          },
          {
            resolve: `gatsby-remark-smartypants`,
            options: {
              dashes: `oldschool`,
            },
          },
          {
            resolve: `gatsby-remark-prettier`,
            options: {
              usePrettierrc: true,
            },
          },
          {
            resolve: `gatsby-remark-prismjs`,
            aliases: {
              classPrefix: 'language-',
            },
          },
          `gatsby-remark-a11y-emoji`,
        ],
      },
    },
    'gatsby-plugin-styled-components',
    'gatsby-plugin-flow',
  ],
};
