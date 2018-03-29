// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import config from '../../data/SiteConfig';
import MainHeader from '../components/Layout/Header';
import About from '../components/About/About';

const BodyContainer = styled.div`
  padding: ${props => props.theme.sitePadding};
`;

class AboutPage extends Component<*, *> {
  render() {
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
            <About />
          </BodyContainer>
        </main>
      </div>
    );
  }
}

export default AboutPage;
