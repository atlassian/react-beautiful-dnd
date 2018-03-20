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

const ListItem = ({ path }) => {
  const bits = path.split('/').filter(a => a);
  let titleBits = bits[bits.length - 1].split('-');

  if (!isNaN(titleBits[0])) {
    titleBits = titleBits.slice(1);
  }

  const title = titleBits.map(s => s[0].toUpperCase() + s.slice(1)).join(' ');

  return <ul key={path}><Link to={path}>{title}</Link></ul>;
};

class ExamplePage extends Component<*, *> {
  render() {
    const examples = this.props.data.allSitePage && this.props.data.allSitePage.edges;
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
            <h1>Examples</h1>
            <ul>
              {examples.map(n => ListItem(n.node))}
            </ul>
          </BodyContainer>
        </main>
      </div>
    );
  }
}

export default ExamplePage;

export const pageQuery = graphql`
  query examplesQuery {
  allSitePage(filter: {
    path: { regex: "/^\/examples\/.+/" }
  }) {
    edges {
      node {
        id
        path
        context {
          dir
        }
      }
    }
  }
}
`;
