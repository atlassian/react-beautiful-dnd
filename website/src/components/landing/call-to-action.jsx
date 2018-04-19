// @flow
import React from 'react';
import Link from 'gatsby-link';
import { colors } from '@atlaskit/theme';
import SendIcon from '@atlaskit/icon/glyph/send';
import BookIcon from '@atlaskit/icon/glyph/book';
import EditIcon from '@atlaskit/icon/glyph/edit';
import styled, { keyframes } from 'styled-components';
import { grid } from '../../layouts/constants';

const ActionBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: ${grid * 2}px;
`;

const ActionLink = styled(Link)`
  border: 2px solid grey;
  margin-bottom: ${grid}px;
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

  ${ActionLink}:hover &, ${ActionLink}:active & {
    animation: ${shake} 0.4s linear infinite;
  }
`;

const GetStartedLink = ActionLink.extend`
  background-color: ${colors.G300};
  border-color: ${colors.G100};
  font-size: 1.5rem;

  :hover, :active {
    background-color: ${colors.G200};
  }
`;

const ExampleLink = ActionLink.extend`
  background-color: ${colors.Y300};
  border-color: ${colors.Y100};
  width: 160px;

  :hover, :active {
    background-color: ${colors.Y200};
  }
`;

const DocumentationLink = ActionLink.extend`
  background-color: ${colors.P300}
  border-color: ${colors.P100};
  width: 160px;

  :hover, :active {
    background-color: ${colors.P200};
  }
`;

export default () => (
  <ActionBox>
    <GetStartedLink to="/guides/get-started">
      Get started
      <ButtonIcon>
        <SendIcon size="large" label="Get started" />
      </ButtonIcon>
    </GetStartedLink>
    <ExampleLink to="/examples">
      <span>Examples</span>
      <ButtonIcon>
        <EditIcon size="medium" label="Examples" />
      </ButtonIcon>
    </ExampleLink>

    <DocumentationLink to="/documentation">
      <span>Documentation</span>
      <ButtonIcon>
        <BookIcon size="medium" label="Documentation" />
      </ButtonIcon>
    </DocumentationLink>
  </ActionBox>
);

