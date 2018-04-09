// @flow
import React from 'react';
import Link from 'gatsby-link';

type ExampleEdge = {
  node: {
    path: string
  }
}

type ExampleData = {
  allSitePage: {
    edges: [ExampleEdge]
  }
}

const ExamplesList = ({ data }: { data: ExampleData }) => (
  <div>
    <h1>List Of Examples</h1>
    <ul>
      {data.allSitePage.edges.map(({ node }) => (
        <ul key={node.path}>
          <Link to={node.path} href={node.path}>
            {node.path.replace('/examples/', '').replace(/\/$/, '')}
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
  query examplesList {
    allSitePage(filter: { path: { regex: "/^/examples/.+/" } }) {
      edges {
        node {
          path
        }
      }
    }
  }
`;
