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
  font-family: 'Clicker Script', cursive;
  font-weight: normal;
  font-size: 90px;
`;

const Tagline = styled.p`
  font-size: 20px;
`;

const Landing = styled.div`
  /* Trello blue 500 https://design.trello.com/style/color */
  background: #0079BF;

  color: white;
  min-height: 100vh;
`;

const SideBySide = styled.div`
  display: flex;
  justify-content: center;
  padding-top: ${grid * 10}px;
  padding-left: ${grid * 6}px;
  padding-right: ${grid * 6}px;
  max-width: 1400px;
  margin: 0 auto;

  @media screen and (max-width: 1200px) {
    flex-direction: column;
  }
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

const Footer = styled.footer``;

// const Footer = styled.div`
//   flex-growth: 0;
//   flex-shrink: 0;

//   margin-top: ${grid * 2}px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
// `;

// const BoardContainer = styled.div`
//   flex-grow: 1;
//   flex-shrink: 1;
//   overflow: auto;
//   max-width: 600px;
//   margin: 0 auto;
// `;

// const Heading = styled.header`
//   margin-bottom: ${grid * 2}px;
// `;
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
        </Content>
        <Example>
          <Board />
        </Example>
      </SideBySide>
      <Footer>
        {/*<GithubStarButton />*/}
      </Footer>
    </Landing>
  </React.Fragment>
);

export default IndexPage;
