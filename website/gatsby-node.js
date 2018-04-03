// @flow
/* eslint-disable spaced-comment */
const path = require('path');
const kebabCase = require('lodash.kebabcase');

/*::
type boundActionCreatorsType = {
  createNodeField: (any) => any,
  createPage: (any) => any,
}

type createNode = {
  node: {
    internal: {
      type: string,
    },
    parent: any,
    frontmatter: {
      slug: string,
    }
  },
  boundActionCreators: boundActionCreatorsType,
  getNode: (any) => any,
}
*/

exports.onCreateNode = ({ node, boundActionCreators, getNode }/*: createNode*/) => {
  const { createNodeField } = boundActionCreators;
  let slug;
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent);
    const parsedFilePath = path.parse(fileNode.relativePath);
    if (
      Object.prototype.hasOwnProperty.call(node, 'frontmatter') &&
      Object.prototype.hasOwnProperty.call(node.frontmatter, 'slug')
    ) {
      slug = `/${kebabCase(node.frontmatter.slug)}`;
    } else if (parsedFilePath.name !== 'index' && parsedFilePath.dir !== '') {
      createNodeField({ node, name: 'dir', value: parsedFilePath.dir });
      slug = `/${parsedFilePath.dir}/${parsedFilePath.name}/`;
    } else if (parsedFilePath.dir === '') {
      slug = `/${parsedFilePath.name}/`;
    } else {
      slug = `/${parsedFilePath.dir}/`;
    }
    createNodeField({ node, name: 'slug', value: slug });
  }
};

/*::
type createPages = {
  graphql: any,
  boundActionCreators: boundActionCreatorsType,
}
*/

exports.createPages = ({ graphql, boundActionCreators }/*: createPages*/)/*: Promise<any>*/ => {
  const { createPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    const postPage = path.resolve('src/templates/post.js');
    const lessonPage = path.resolve('src/templates/lesson.js');
    const categoryPage = path.resolve('src/templates/category.js');
    resolve(
      graphql(
        `
        {
          allMarkdownRemark {
            edges {
              node {
                frontmatter {
                  title
                }
                fields {
                  slug
                  dir
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

        const tagSet = new Set();
        const categorySet = new Set();

        result.data.allMarkdownRemark.edges.forEach((edge) => {
          if (edge.node.frontmatter.tags) {
            edge.node.frontmatter.tags.forEach((tag) => {
              tagSet.add(tag);
            });
          }

          if (edge.node.frontmatter.category) {
            categorySet.add(edge.node.frontmatter.category);
          }
          if (edge.node.frontmatter.type === 'post') {
            createPage({
              path: edge.node.fields.slug,
              component: postPage,
              context: {
                slug: edge.node.fields.slug,
              },
            });
          } else if (edge.node.fields.dir && edge.node.fields.slug) {
            createPage({
              path: edge.node.fields.slug,
              component: lessonPage,
              context: {
                slug: edge.node.fields.slug,
                dir: edge.node.fields.dir,
              },
            });
          }
        });

        const categoryList = Array.from(categorySet);
        categoryList.forEach((category) => {
          createPage({
            path: `/categories/${kebabCase(category)}/`,
            component: categoryPage,
            context: {
              category,
            },
          });
        });
      })
    );
  });
};

/*::
type modifyBabelrc = {
  babelrc: any
}
*/

exports.modifyBabelrc = ({ babelrc }/*: modifyBabelrc */) => ({
  ...babelrc,
  presets: babelrc.presets.concat(['flow']),
});

/*::
type modifyWebpackConfig = {
  config: {
    plugin: (any, any, any) => any,
  },
  stage: string,
}
*/
