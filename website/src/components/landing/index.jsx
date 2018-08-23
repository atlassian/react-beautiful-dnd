// @flow
import React from 'react';
import styled from 'react-emotion';
import CommonPage from '../common-page';
import Welcome from './welcome';
import Beautiful from './beautiful';
import Accessible from './accessible';

const FullPageSection = styled.section`
  min-height: 100vh;
`;

const IndexPage = () => (
  <CommonPage>
    <FullPageSection>
      <Welcome />
    </FullPageSection>
    <FullPageSection>
      <Beautiful />
    </FullPageSection>
    <FullPageSection>
      <Accessible />
    </FullPageSection>
  </CommonPage>
);

export default IndexPage;
