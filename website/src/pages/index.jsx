// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import SEO from '../components/SEO';
import config from '../../data/SiteConfig';
import CtaButton from '../components/CtaButton';
import Navigation from '../components/Layout/Navigation';

class Index extends Component {
  render() {
    const readMe = this.props.data.markdownRemark;
    return (
      <div className="index-container">
        <Helmet title={config.siteTitle} />
        <main>
          <IndexHeadContainer>
            <Navigation />
            <Hero>
              <img src={config.siteLogo} width="150px" />
              <h1>{config.siteTitle}</h1>
              <h4>{config.siteDescription}</h4>
            </Hero>
          </IndexHeadContainer>
          <BodyContainer>
            <div dangerouslySetInnerHTML={{ __html: readMe.html }} />
            <div dangerouslySetInnerHTML={{ __html: readMe.tableOfContents }} />
          </BodyContainer>
        </main>
      </div>
    );
  }
}

export default Index;

const IndexHeadContainer = styled.div`
  background: ${props => props.theme.brand};
  padding: ${props => props.theme.sitePadding};
  text-align: center;
`;

const Hero = styled.div`
  padding: 50px 0;
  & > h1 {
    font-weight: 600;
  }
`;

const BodyContainer = styled.div`
  padding: ${props => props.theme.sitePadding};
  max-width: ${props => props.theme.contentWidthLaptop};
  margin: 0 auto;
`;

export const pageQuery = graphql`
  query IndexQuery {
  markdownRemark(headings: {value: {eq: "react-beautiful-dnd"}, depth: {eq: 1}}) {
    tableOfContents
    html
  }
}
`;
