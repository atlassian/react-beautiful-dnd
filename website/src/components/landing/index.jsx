// @flow
import React from 'react';
import styled from 'react-emotion';
import CommonPage from '../CommonPage';
import Welcome from './welcome';
import Beautiful from './beautiful';
import Accessible from './accessible';

const Section = styled.section`
  min-height: 100vh;
`;

const IndexPage = () => (
  <CommonPage>
    <Section>
      <Welcome />
    </Section>
    <Section>
      <Beautiful />
    </Section>
    <Section>
      <Accessible />
    </Section>
  </CommonPage>
);

export default IndexPage;
