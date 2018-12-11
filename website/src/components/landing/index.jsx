// @flow
import React from 'react';
import styled from 'styled-components';
import CommonPage from '../common-page';
import { colors } from '../../constants';
import Welcome from './welcome';
import Beautiful from './beautiful';
import Accessible from './accessible';

const FullPageSection = styled.section`
  min-height: 100vh;
  background-color: ${colors.dark500};
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
