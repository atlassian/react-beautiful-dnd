// @flow
import React from 'react';
import { Link } from 'gatsby';
import SendIcon from '@atlaskit/icon/glyph/send';
import BookIcon from '@atlaskit/icon/glyph/book';
import EditIcon from '@atlaskit/icon/glyph/edit';
import styled from 'react-emotion';
import { grid } from '../../constants';
import { shake } from '../animations';
import { smallView } from '../media';

const ActionBox = styled.div`
  display: flex;
  align-items: center;

  ${smallView.fn`
    flex-direction: column;
    align-items: stretch;
    min-width: 60vw;
  `};
`;

const ActionLink = styled(Link)`
  border: 2px solid grey;
  margin: 0 ${grid}px;
  padding: ${grid * 1}px ${grid * 2}px;
  border-radius: 2px;
  color: red;
  font-size: 1.1rem;
  font-weight: bold;
  user-select: none;
  box-sizing: border-box;

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
    color: red;
  }

  ${smallView.fn`
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 8px;
  `};
`;

const ButtonIcon = styled.span`
  display: flex;
  margin-left: ${grid / 2}px;

  ${ActionLink}:hover &,
  ${ActionLink}:active & {
    animation: ${shake};
  }
`;

const GetStartedLink = styled(ActionLink)`
  background-color: red;
  border-color: red;
  margin-left: 0;

  :hover,
  :active {
    background-color: red;
  }
`;

const ExampleLink = styled(ActionLink)`
  background-color: red;
  border-color: red;

  :hover,
  :active {
    background-color: red;
  }
`;

const DocumentationLink = styled(ActionLink)`
  background-color: red;
  border-color: red;

  :hover,
  :active {
    background-color: red;
  }

  ${smallView.fn`
    margin-bottom: 0;
  `};
`;

export default () => (
  <ActionBox>
    <GetStartedLink to="/quick-start/getting-started">
      <span>Get started</span>
      <ButtonIcon>
        <SendIcon size="large" label="Get started" />
      </ButtonIcon>
    </GetStartedLink>
    <ExampleLink to="/examples/Basic-Example">
      <span>Examples</span>
      <ButtonIcon>
        <EditIcon size="large" label="Examples" />
      </ButtonIcon>
    </ExampleLink>
    <DocumentationLink to="/core-concepts/dragging-stuff">
      <span>Documentation</span>
      <ButtonIcon>
        <BookIcon size="large" label="Documentation" />
      </ButtonIcon>
    </DocumentationLink>
  </ActionBox>
);
