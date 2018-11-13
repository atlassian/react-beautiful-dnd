// @flow
import React from 'react';
import { Link, graphql } from 'gatsby';

type ExampleEdge = {
  node: {
    path: string,
  },
};

type ExampleData = {
  allSitePage: {
    edges: [ExampleEdge],
  },
};

const PrivateExamplesList = ({ data }: { data: ExampleData }) => {
  const pages = data.allSitePage ? (
    data.allSitePage.edges.map(({ node }) => (
      <li key={node.path}>
        <Link to={node.path} href={node.path}>
          {node.path.replace('/private/', '').replace(/\/$/, '')}
        </Link>
      </li>
    ))
  ) : (
    <li>No private examples</li>
  );

  return (
    <div>
      <h1>Internal Examples</h1>
      <h2>These examples are for development and not documentation</h2>
      <ul>{pages}</ul>
    </div>
  );
};

export default PrivateExamplesList;

/* eslint-disable no-undef */
export const query = graphql`
  query privateExampleList {
    allSitePage(filter: { path: { regex: "/^/private/.+/" } }) {
      edges {
        node {
          path
        }
      }
    }
  }
`;
