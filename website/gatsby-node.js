// @flow
/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
const path = require('path');
const startCase = require('lodash.startcase');

/* ::
type fileNode = { relativePath: string }

type Node = {
  parent: any,
  internal: {
    type: string,
  }
}

type nodeField = { node: Node,  name: string, value: string }

type markdownEdge = {
  node: {
    fields: {
      slug: string,
      dir: string,
      name: string,
    }
  }
}

type markdownGraphQLResult = {
  errors?: any,
  data: {
    allMarkdownRemark: {
      edges: [

      ]
    }
  }
}

type Page = {
  path: string,
  component: any,
  context: {
    slug: string,
    dir: string,
    name: string,
  },
}

type boundActionCreators = {
  createNodeField: (nodeField) => mixed,
  createPage: (Page) => mixed
}

type NodeParams = {
  node: Node,
  boundActionCreators: boundActionCreators,
  getNode: (string) => fileNode,
  graphql: (string) => Promise<markdownGraphQLResult>
}
*/

exports.onCreateNode = ({ node, boundActionCreators, getNode }/* : NodeParams */) => {
  const { createNodeField } = boundActionCreators;
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent);
    const parsedFilePath = path.parse(fileNode.relativePath);
    let slug = '/docs';
    let name = '';
    if (parsedFilePath.dir) {
      slug += `/${parsedFilePath.dir.toLowerCase()}`;
      name = startCase(parsedFilePath.dir);
    }
    if (parsedFilePath.name !== 'index') {
      slug += `/${parsedFilePath.name.toLowerCase()}`;
      name = startCase(parsedFilePath.name);
    }

    createNodeField({ node, name: 'slug', value: slug });
    createNodeField({ node, name: 'title', value: name });
    createNodeField({
      node,
      name: 'dir',
      value: parsedFilePath.dir.toLowerCase(),
    });
  }
};

exports.createPages = ({ graphql, boundActionCreators }/* : NodeParams */)/* : Promise<any> */ => {
  const { createPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    const markdownPage = path.resolve('src/templates/markdown.js');
    resolve(
      graphql(
        `
          {
            allMarkdownRemark {
              edges {
                node {
                  fields {
                    slug
                  }
                }
              }
            }
          }
        `
      ).then((result) => {
        if (result.errors) {
          /* eslint-disable no-console */
          console.log(result.errors);
          reject(result.errors);
        }

        result.data.allMarkdownRemark.edges.forEach((edge) => {
          createPage({
            path: edge.node.fields.slug,
            component: markdownPage,
            context: {
              slug: edge.node.fields.slug,
              dir: edge.node.fields.dir,
              name: edge.node.fields.name,
            },
          });
        });
      })
    );
  });
};
