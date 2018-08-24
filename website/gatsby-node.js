// @flow
/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
const path = require('path');
const lowerCase = require('lodash.lowercase');
const fs = require('fs');
const findUp = require('find-up');

const gitUrlBase =
  'https://github.com/atlassian/react-beautiful-dnd/edit/master';

/* ::
type fileNode = { relativePath: string, absolutePath: string }

type BaseNode = {
  internal: {
    type: string,
  }
}

type Node = {
  internal: {
    type: 'SitePage | MarkdownRemark',
  },
  layout: string,
  componentPath: string,
  parent: any,
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
  layout?: string,
  path: string,
  component: any,
  context: {
    slug: string,
    dir: string,
    name: string,
  },
}

type actions = {
  createNodeField: (nodeField) => mixed,
  createPage: (Page) => mixed
}

type NodeParams = {
  node: Node,
  actions: actions,
  getNode: (string) => fileNode,
  graphql: (string) => Promise<markdownGraphQLResult>
}

type PageParams = {
  page: Page,
  actions: actions,
}
*/

const capitalise = value => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const addMD = async ({ getNode, node, createNodeField }) => {
  const fileNode = getNode(node.parent);
  const parsedFilePath = path.parse(fileNode.relativePath);

  const directory = parsedFilePath.dir.toLowerCase();
  const slug = `/${directory}/${parsedFilePath.name.toLowerCase()}`;
  const title = (() => {
    const base = lowerCase(parsedFilePath.name);
    if (directory !== 'api') {
      return capitalise(base);
    }

    const camel = base
      .split(' ')
      .map(capitalise)
      .join('');

    return `<${camel} />`;
  })();

  // The fileNode.relativePath gives us the path relative to the website
  // directory while we need it relative to git root.
  const pkgRoot = findUp.sync('.git');
  const relativePath = path.relative(
    path.dirname(pkgRoot),
    fileNode.absolutePath,
  );

  createNodeField({ node, name: 'slug', value: slug });
  createNodeField({
    node,
    name: 'gitUrl',
    value: `${gitUrlBase}/${relativePath}`,
  });
  createNodeField({ node, name: 'title', value: title });
  createNodeField({
    node,
    name: 'dir',
    value: directory,
  });
};

const addRaw = (node, createNodeField) => {
  if (node.layout === 'example') {
    const raw = fs.readFileSync(node.componentPath, 'utf-8');
    createNodeField({ node, name: 'raw', value: raw });
  } else {
    createNodeField({ node, name: 'raw', value: '' });
  }
};

exports.onCreateNode = ({ node, actions, getNode } /* : NodeParams */) => {
  const { createNodeField } = actions;
  if (node.internal.type === 'MarkdownRemark') {
    addMD({ getNode, node, createNodeField });
  } else if (node.internal.type === 'SitePage') {
    addRaw(node, createNodeField);
  }
};

exports.createPages = ({ graphql, actions } /* : NodeParams */) => {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const markdownPage = path.resolve('src/templates/markdown.jsx');
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
        `,
      ).then(result => {
        if (result.errors) {
          /* eslint-disable-next-line no-console */
          console.log(result.errors);
          reject(result.errors);
        }

        result.data.allMarkdownRemark.edges.forEach(edge => {
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
      }),
    );
  });
};

exports.onCreatePage = async ({ page, actions } /* : PageParams  */) => {
  const { createPage } = actions;

  return new Promise(resolve => {
    if (page.path === '/') {
      page.layout = 'landing';
      // Update the page.
      createPage(page);
    } else if (page.path.match(/^\/(examples|internal)\/./)) {
      page.layout = 'example';
      createPage(page);
    }
    resolve();
  });
};
