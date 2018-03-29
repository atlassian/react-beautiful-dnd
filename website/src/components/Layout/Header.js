// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import Navigation from './Navigation';

class MainHeader extends Component<*, *> {
  render() {
    return (
      <SiteContainer>
        <Navigation />
      </SiteContainer>
    );
  }
}

const SiteContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.brand};
  height: 100%;
  padding:  25px;
`;

export default MainHeader;
