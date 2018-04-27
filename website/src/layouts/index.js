// @flow
import React, { type Node } from 'react';

import PageWrapper from '../components/PageWrapper';
import CommonPage from '../components/CommonPage';
import type { SidebarData } from '../components/types';

type Props = {
  children: () => Node,
  location: { pathname: string },
  data: SidebarData
};

const regex = /^\/(documentation|examples|internal)/;

const PageTemplate = ({ children, location, data }: Props) => (
  <CommonPage>
    <PageWrapper
      examples={data.examples}
      docs={data.docs}
      internal={data.internal}
      showInternal={data.site.siteMetadata.development}
    >
      {children()}
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
    docs: allMarkdownRemark(
      filter: { fields: { slug: { regex: "/^/documentation//" } } }
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
    site: site {
      siteMetadata {
        development
      }
    }
  }
`;
