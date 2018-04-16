// @flow
import React from 'react';
import { colors } from '@atlaskit/theme';
import styled from 'styled-components';
import Board from '../components/landing/board';
import CallToAction from '../components/landing/call-to-action';
import GithubStarButton from '../components/landing/github-star-button';
import ScreenReaderWatcher from '../components/landing/screen-reader-watcher';
import { grid } from '../layouts/constants';

const Title = styled.h1`
  text-align: center;
  font-size: 50px;
`;

const Tagline = styled.p`
  text-align: center;
  font-size: 20px;
`;

const Landing = styled.div`
  /* Trello blue 500 https://design.trello.com/style/color */
  background: #0079BF;

  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Footer = styled.div`
  flex-growth: 0;
  flex-shrink: 0;
`;

const BoardContainer = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  overflow: auto;
  max-width: 600px;
  margin: 0 auto;
`;

const IndexPage = () => (
  <Landing>
    <Title>react-beautiful-dnd</Title>
    <Tagline>Beautiful, accessible drag and drop for lists with React.js </Tagline>
    <GithubStarButton />
    <BoardContainer>
      <Board />
      <ScreenReaderWatcher />
    </BoardContainer>
    <Footer>
      <CallToAction />
    </Footer>
  </Landing>
);

export default IndexPage;
