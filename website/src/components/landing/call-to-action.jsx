// @flow
import React from 'react';
import { Link } from 'gatsby';
import { colors } from '@atlaskit/theme';
import SendIcon from '@atlaskit/icon/glyph/send';
import BookIcon from '@atlaskit/icon/glyph/book';
import EditIcon from '@atlaskit/icon/glyph/edit';
import styled from 'react-emotion';
import { grid } from '../constants';
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
  border-radius: 2px;
  color: ${colors.N10};
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
    color: ${colors.N10};
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
  background-color: ${colors.G300};
  border-color: ${colors.G100};
  margin-left: 0;

  :hover,
  :active {
    background-color: ${colors.G200};
  }
`;

const ExampleLink = styled(ActionLink)`
  background-color: ${colors.Y300};
  border-color: ${colors.Y100};

  :hover,
  :active {
    background-color: ${colors.Y200};
  }
`;

const DocumentationLink = styled(ActionLink)`
  background-color: ${colors.P300}
  border-color: ${colors.P100};

  :hover, :active {
    background-color: ${colors.P200};
  }

  ${smallView.fn`
    margin-bottom: 0;
  `}
`;

export default () => (
  <ActionBox>
    <GetStartedLink to="/guides/get-started">
      <span>Get started</span>
      <ButtonIcon>
        <SendIcon size="large" label="Get started" />
      </ButtonIcon>
    </GetStartedLink>
    <ExampleLink to="/examples">
      <span>Examples</span>
      <ButtonIcon>
        <EditIcon size="large" label="Examples" />
      </ButtonIcon>
    </ExampleLink>
    <DocumentationLink to="/documentation">
      <span>Documentation</span>
      <ButtonIcon>
        <BookIcon size="large" label="Documentation" />
      </ButtonIcon>
    </DocumentationLink>
  </ActionBox>
);
