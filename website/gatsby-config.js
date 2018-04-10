// @flow
module.exports = {
  siteMetadata: {
    title: 'react beautiful-dnd',
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'src',
        path: `${__dirname}/docs/`,
      },
    },
    'gatsby-transformer-remark',
  ],
};
