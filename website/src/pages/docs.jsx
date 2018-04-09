// @flow
import React from 'react';
import Link from 'gatsby-link';

type MdEdge = {
  node: {
    fields: {
      slug: string,
      dir: string,
      title: string,
    }
  }
}

type Data = {
  allMarkdownRemark: {
    edges: [
      MdEdge
    ]
  }
}

const ExamplesList = ({ data }: { data: Data }) => (
  <div>
    <h1>All Documentation</h1>
    <ul>
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <ul key={node.fields.slug}>
          <Link to={node.fields.slug} href={node.fields.slug}>
            {node.fields.dir && `${node.fields.dir} - `}
            {node.fields.title}
          </Link>
        </ul>
      ))}
    </ul>
  </div>
);

export default ExamplesList;

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query docsList {
    allMarkdownRemark(
      filter: { fields: { slug: { regex: "/^/docs//" } } }
      sort: { fields: [fields___dir], order: ASC }
    ) {
      edges {
        node {
          fields {
            slug
            title
            dir
          }
        }
      }
    }
  }
`;
