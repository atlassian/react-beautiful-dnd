// @flow
module.exports = {
  siteMetadata: {
    title: 'react beautiful-dnd',
    isDevelopment: process.env.NODE_ENV === 'development',
  },
  plugins: [
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
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 740,
            },
          },
          {
            resolve: `gatsby-remark-smartypants`,
            options: {
              dashes: `oldschool`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-a11y-emoji`,
        ],
      },
    },
    'gatsby-plugin-emotion',
    'gatsby-plugin-flow',
    'gatsby-plugin-sharp',
  ],
};
