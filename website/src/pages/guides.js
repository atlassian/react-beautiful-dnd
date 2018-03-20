// @flow
import React, { Component } from 'react';
import Link from 'gatsby-link';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import config from '../../data/SiteConfig';
import MainHeader from '../components/Layout/Header';

const BodyContainer = styled.div`
  padding: ${props => props.theme.sitePadding};
`;

const ListItem = ({ fields, frontmatter }) => (
  <ul key={fields.slug}><Link to={fields.slug}>{frontmatter.title}</Link></ul>
);

class GuidesPage extends Component<*, *> {
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

export const pageQuery = graphql`
  query guidesQuery {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
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
            tags
            cover
            date
          }
        }
      }
    }
  }
`;
