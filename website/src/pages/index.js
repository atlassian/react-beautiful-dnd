// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import config from '../../data/SiteConfig';
import Navigation from '../components/Layout/Navigation';
import theme from '../layouts/theme';

type Props = {
  data: {
    markdownRemark: {
      html: string,
      tableOfContents: string,
    }
  }
}

class Index extends Component<Props, *> {
  render() {
    const readMe = this.props.data.markdownRemark;
    return (
      <div className="index-container">
        <Helmet title={config.siteTitle} />
        <main>
          <IndexHeadContainer>
            <Navigation />
            <Hero>
              <h1>{config.siteTitle}</h1>
              <h4>{config.siteDescription}</h4>
            </Hero>
          </IndexHeadContainer>
          <BodyContainer>
            {/* eslint-disable react/no-danger */}
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
  color: ${theme.lightGrey}
`;

const BodyContainer = styled.div`
  padding: ${props => props.theme.sitePadding};
  max-width: ${props => props.theme.contentWidthLaptop};
  margin: 0 auto;
`;

/* eslint-disable no-undef */
// $FlowFixMe
export const pageQuery = graphql`
  query IndexQuery {
  markdownRemark(fields: {dir: {eq: null} slug:{eq: "/README/"} }) {
    tableOfContents
    html
  }
}
`;
