// @flow
import React from 'react';
import ExampleWrapper, { gatsbyUrlToCSBPath } from '../components/ExampleWrapper';
import CommonPage from '../components/CommonPage';
import PageWrapper from '../components/PageWrapper';

const ExamplePage = ({ children, data, location, ...rest }) => (
  <CommonPage>
    <PageWrapper
      examples={data.examples}
      docs={data.docs}
      internal={data.internal}
      showInternal={data.site.siteMetadata.development}
    >
      <ExampleWrapper
        path={gatsbyUrlToCSBPath(location.pathname)}
      >
        {children()}
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
