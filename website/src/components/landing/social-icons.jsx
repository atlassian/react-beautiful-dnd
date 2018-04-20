// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import GithubIcon from 'react-icons/lib/fa/github';
import TwitterIcon from 'react-icons/lib/fa/twitter';
import { grid } from '../../layouts/constants';
import { shake } from '../animations';

const Container = styled.div`
  display: flex;
`;

const ExternalLink = styled.a`
  color: ${colors.N0};
  transition: color 0.2s ease;

  :hover, :active {
    animation: ${shake};
    color: ${colors.T75};
  }
`;

const TwitterLink = ExternalLink.extend`
  margin-left: ${grid}px;
`;

const iconProps: Object = {
  width: 40,
  height: 40,
};

export default class SocialIcons extends React.Component <*> {
  render() {
    return (
      <Container>
        <ExternalLink href="https://github.com/atlassian/react-beautiful-dnd"><GithubIcon {...iconProps} /></ExternalLink>
        <TwitterLink href="https://twitter.com/alexandereardon"><TwitterIcon {...iconProps} /></TwitterLink>
      </Container>
    );
  }
};