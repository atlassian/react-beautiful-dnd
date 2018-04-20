// @flow
import React from 'react';
import { colors } from '@atlaskit/theme';
import styled, { css } from 'styled-components';

import Board from '../components/landing/board';
import CallToAction from '../components/landing/call-to-action';
import SocialIcons from '../components/landing/social-icons';
import GithubStarButton from '../components/landing/github-star-button';
import ScreenReaderWatcher from '../components/landing/screen-reader-watcher';
import { grid } from '../layouts/constants';

const media = {
  singleColumn: (...args: mixed[]) => `@media screen and (max-width: 1350px) { ${css(...args)} }`,
};

const Title = styled.h1`
  font-family: 'Clicker Script', cursive;
  font-weight: normal;
  font-size: 90px;

  ${media.singleColumn`
    text-align: center;
    font-size: 12vw;
  `}
`;

const Tagline = styled.p`
  font-size: 20px;

  ${media.singleColumn`text-align: center`}
`;

const Landing = styled.div`
  /* Trello blue 500 https://design.trello.com/style/color */
  background: #0079BF;

  color: white;
  min-height: 100vh;
`;

const SideBySide = styled.div`
  padding-top: ${grid * 10}px;
  padding-left: ${grid * 6}px;
  padding-right: ${grid * 6}px;
  max-width: 1400px;
  margin: 0 auto;

  display: flex;
  /* wrap early if we need it (hopefully not!)*/
  /* flex-wrap: wrap; */

  ${media.singleColumn`
    flex-direction: column;
    align-items: center;
  `}
`;

const Actions = styled.div`
  margin-top: ${grid * 2}px;
`;

const Content = styled.div`
  margin-top: ${grid * 8}px;
  flex-grow: 1;
`;
const Example = styled.div`
  flex-grow: 0;
`;

const IndexPage = () => (
  <React.Fragment>
    <Landing>
      <SideBySide>
        <Content>
          <Title>React-Beautiful-Dnd</Title>
          <Tagline>Beautiful, accessible drag and drop for lists with React.js </Tagline>
          <Actions>
            <CallToAction />
          </Actions>
          <SocialIcons />
        </Content>
        <Example>
          <Board />
        </Example>
      </SideBySide>
    </Landing>
  </React.Fragment>
);

export default IndexPage;
