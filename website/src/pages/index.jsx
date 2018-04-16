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
  min-height: 100vh;
`;

const IndexPage = () => (
  <Landing>
    <Title>react-beautiful-dnd</Title>
    <Tagline>Beautiful, accessible drag and drop for lists with React.js </Tagline>
    <GithubStarButton />
    <Board />
    <ScreenReaderWatcher />
    <CallToAction />
  </Landing>
);

export default IndexPage;
