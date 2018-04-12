// @flow
import React from 'react';
import { colors } from '@atlaskit/theme';
import SendIcon from '@atlaskit/icon/glyph/send';
import BookIcon from '@atlaskit/icon/glyph/book';
import EditIcon from '@atlaskit/icon/glyph/edit';
import styled, { keyframes } from 'styled-components';
import LandingBoard from '../components/landing-board';
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
  background: rgb(0, 121, 191);
  color: white;
  min-height: 100vh;
`;

const ActionBox = styled.div`
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Action = styled.a`
  border: 2px solid grey;
  margin: ${grid}px;
  padding: ${grid * 2}px ${grid * 3}px;
  border-radius: 2px;
  border-radius: 2px;
  color: ${colors.N10};
  font-size: 1.1rem;
  font-weight: bold;
  user-select: none;

  /* shared border styles */
  border-width: 4px;
  border-style: solid;

  /* used to align the text next to the icon */
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    cursor: pointer;
    text-decoration: none;
    color: ${colors.N10};
  }
`;

const movement: number = 6;

const shake = keyframes`
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(${movement}deg);
  }

  50% {
    transform: rotate(0deg);
  }

  75% {
    transform: rotate(-${movement}deg);
  }

  100% {
    transform: rotate(0deg);
  }
`;

const ButtonIcon = styled.span`
  display: flex;
  margin-left: ${grid / 2}px;

  a:hover > &, a:active > & {
    animation: ${shake} 0.4s linear infinite;
  }
`;

const GetStartedButton = Action.extend`
  background-color: ${colors.G300};
  border-color: ${colors.G100};
  font-size: 1.5rem;

  :hover, :active {
    background-color: ${colors.G200};
  }
`;

const ExampleButton = Action.extend`
  background-color: ${colors.Y300};
  border-color: ${colors.Y100};
  width: 160px;

  :hover, :active {
    background-color: ${colors.Y200};
  }
`;

const DocumentationButton = Action.extend`
  background-color: ${colors.P300}
  border-color: ${colors.P100};
  width: 160px;

  :hover, :active {
    background-color: ${colors.P200};
  }
`;

const IndexPage = () => (
  <Landing>
    <Title>react-beautiful-dnd</Title>
    <Tagline>Beautiful, accessible drag and drop for lists with React.js </Tagline>
    <LandingBoard />

    <ActionBox>
      <ExampleButton>
        <span>Examples</span>
        <ButtonIcon>
          <EditIcon size="medium" label="Examples" />
        </ButtonIcon>
      </ExampleButton>
      <GetStartedButton>
        Get started
        <ButtonIcon>
          <SendIcon size="large" label="Get started" />
        </ButtonIcon>
      </GetStartedButton>
      <DocumentationButton>
        <span>Documentation</span>
        <ButtonIcon>
          <BookIcon size="medium" label="Documentation" />
        </ButtonIcon>
      </DocumentationButton>
    </ActionBox>
  </Landing>
);

export default IndexPage;
