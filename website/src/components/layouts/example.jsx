// @flow
import React, { type Node } from 'react';
import { graphql } from 'gatsby';

import ExampleWrapper, { gatsbyUrlToCSBPath } from '../ExampleWrapper';
import CommonPage from '../CommonPage';
import PageWrapper from '../PageWrapper';
import { getTitleFromExamplePath } from '../../utils';
import type { SidebarData } from '../types';

type Props = {
  data: SidebarData,
  children: Node,
  location: {
    pathname: string,
  },
};

const ExamplePage = ({ children, data, location }: Props) => (
  <CommonPage>
    <PageWrapper
      examples={data.examples}
      docs={data.docs}
      internal={data.internal}
      showInternal={data.site.siteMetadata.isDevelopment}
    >
      <ExampleWrapper
        title={getTitleFromExamplePath(location.pathname, '/examples/')}
        path={gatsbyUrlToCSBPath(location.pathname)}
      >
        {children}
      </ExampleWrapper>
    </PageWrapper>
  </CommonPage>
);

export default ExamplePage;

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query examplesSidebarInfo {
    examples: allSitePage(filter: { path: { regex: "/^/examples/.+/" } }) {
      edges {
        node {
          path
        }
      }
    }
    internal: allSitePage(filter: { path: { regex: "/^/internal/.+/" } }) {
      edges {
        node {
          path
        }
      }
    }
    docs: allMarkdownRemark(sort: { fields: [fields___dir], order: ASC }) {
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
    site: site {
      siteMetadata {
        isDevelopment
      }
    }
  }
`;
