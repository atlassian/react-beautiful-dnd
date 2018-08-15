// @flow
import React, { type Node } from 'react';
import { graphql } from 'gatsby';

import PageWrapper from '../PageWrapper';
import CommonPage from '../CommonPage';
import type { SidebarData } from '../types';

type Props = {
  children: Node,
  data: SidebarData,
};

const PageTemplate = ({ children, data }: Props) => (
  <CommonPage>
    <PageWrapper
      examples={data.examples}
      docs={data.docs}
      internal={data.internal}
      showInternal={data.site.siteMetadata.isDevelopment}
    >
      {children}
    </PageWrapper>
  </CommonPage>
);

export default PageTemplate;

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query sidebarInfo {
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
