// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import config from '../../data/SiteConfig';
import MainHeader from '../components/Layout/Header';
import ListItem from '../components/ListItem';

const BodyContainer = styled.div`
  padding: ${props => props.theme.sitePadding};
`;

class DocsPage extends Component<*, *> {
  render() {
    let guideEdges = this.props.data.allMarkdownRemark && this.props.data.allMarkdownRemark.edges;
    guideEdges = guideEdges || [];
    return (
      <div className="index-container">
        <Helmet title={config.siteTitle} />
        <main>
          <MainHeader
            siteTitle={config.siteTitle}
            siteDescription={config.siteDescription}
            location={this.props.location}
            logo={config.siteLogo}
          />
          <BodyContainer>
            <h1>Patterns</h1>
            <ul>
              {guideEdges.map(n => ListItem(n.node))}
            </ul>
          </BodyContainer>
        </main>
      </div>
    );
  }
}

export default DocsPage;

/* eslint-disable no-undef */
// $FlowFixMe
export const PatternQuery = graphql`
  query patternsQuery {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [fields___slug], order: ASC }
      filter: { fields: { dir: { eq: "patterns" } } }
    ) {
      edges {
        node {
          fields {
            slug
          }
          excerpt
          timeToRead
          frontmatter {
            title
          }
        }
      }
    }
  }
`;
