// @flow
import React from 'react';
import styled from 'styled-components';
import Media from 'react-media';
import Board from './board';
import CallToAction from './call-to-action';
import SocialIcons from './social-icons';
import { grid } from '../constants';
import { singleColumn } from '../media';

const Title = styled.h1`
  font-family: 'Clicker Script', cursive;
  font-weight: normal;
  font-size: 90px;

  ${singleColumn.fn`
    text-align: center;
    font-size: 10vw;
    white-space: nowrap;
  `}
`;

const Tagline = styled.p`
  font-size: 20px;
  ${singleColumn.fn`text-align: center`}
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

  ${singleColumn.fn`
    flex-direction: column;
    align-items: center;
  `}
`;

const verticalSpacing = `margin-top: ${grid * 4}px;`;

const VerticalRhythm = styled.div`
  ${verticalSpacing}
`;

const Content = styled.div`
  margin-top: ${grid * 8}px;
  flex-grow: 1;

  display: flex;
  flex-direction: column;

  ${singleColumn.fn`
    align-items: center;
  `}
`;

const Example = styled.div`
  flex-grow: 0;

  ${singleColumn.fn`${verticalSpacing}`}
`;

const IndexPage = () => (
  <Landing>
    <SideBySide>
      <Content>
        <Title>React-Beautiful-Dnd</Title>
        <Tagline>Beautiful, accessible drag and drop for lists with React.js </Tagline>
        <VerticalRhythm>
          <CallToAction />
        </VerticalRhythm>
        <VerticalRhythm>
          <SocialIcons />
        </VerticalRhythm>
      </Content>
      <Example>
        <Media query={singleColumn.negatedQuery}>
          {(matches: boolean) => <Board numberOfColumns={matches ? 2 : 1} />}
        </Media>
      </Example>
    </SideBySide>
  </Landing>
);

export default IndexPage;
