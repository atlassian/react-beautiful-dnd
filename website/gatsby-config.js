// @flow
module.exports = {
  siteMetadata: {
    title: 'react beautiful-dnd',
    development: process.env.NODE_ENV === 'development',
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
    'gatsby-transformer-remark',
    'gatsby-plugin-styled-components',
  ],
};
