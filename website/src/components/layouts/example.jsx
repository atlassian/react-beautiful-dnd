// @flow
import React, { type Node } from 'react';
import { StaticQuery, graphql } from 'gatsby';
import ExampleWrapper from '../example-wrapper';
import CommonPage from '../common-page';
import PageWrapper from '../page-wrapper';
import { getTitleFromExamplePath } from '../../utils';
import type { SidebarData } from '../types';

type Props = {
  children: Node,
  location: {
    pathname: string,
  },
  examplePath: string,
};

const ExamplePage = ({ children, location, examplePath }: Props) => (
  <StaticQuery
    query={graphql`
      query examplesSidebarInfo {
        examples: allSitePage(filter: { path: { regex: "/^/examples/.+/" } }) {
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
    `}
    render={(data: SidebarData) => (
      <CommonPage>
        <PageWrapper
          examples={data.examples}
          docs={data.docs}
          internal={data.internal}
        >
          <ExampleWrapper
            title={getTitleFromExamplePath(location.pathname, '/examples/')}
            path={examplePath}
          >
            {children}
          </ExampleWrapper>
        </PageWrapper>
      </CommonPage>
    )}
  />
);

export default ExamplePage;
