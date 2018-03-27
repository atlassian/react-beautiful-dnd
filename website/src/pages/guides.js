// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import config from '../../data/SiteConfig';
import MainHeader from '../components/Layout/Header';
import ListItem, { type ListItemType } from '../components/ListItem';

const BodyContainer = styled.div`
  padding: ${props => props.theme.sitePadding};
`;

type Props = {
  location: string,
  data: {
    allMarkdownRemark: {
      edges: Array<{ node: ListItemType }>
    }
  }
}

class GuidesPage extends Component<Props, *> {
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
            <h1>Guides</h1>
            <ul>
              {guideEdges.map(n => ListItem(n.node))}
            </ul>
          </BodyContainer>
        </main>
      </div>
    );
  }
}

export default GuidesPage;

/* eslint-disable no-undef */
// $FlowFixMe
export const pageQuery = graphql`
  query guidesQuery {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [fields___slug], order: DESC }
      filter: { fields: { dir: { eq: "guides" } } }
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
