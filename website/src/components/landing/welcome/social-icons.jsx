// @flow
import React from 'react';
import styled from 'react-emotion';
import GithubIcon from 'react-icons/lib/fa/github';
import TwitterIcon from 'react-icons/lib/fa/twitter';
import { grid } from '../../../constants';

const Container = styled.div`
  display: flex;
`;

const ExternalLink = styled.a`
  color: red;
  transition: color 0.2s ease;
`;

const TwitterLink = styled(ExternalLink)`
  margin-left: ${grid}px;

  :hover,
  :active {
    color: red;
  }
`;

const GithubLink = styled(ExternalLink)`
  :hover,
  :active {
    color: red;
  }
`;

const iconProps: Object = {
  width: 40,
  height: 40,
};

export default class SocialIcons extends React.Component<*> {
  render() {
    return (
      <Container>
        <GithubLink href="https://github.com/atlassian/react-beautiful-dnd">
          <GithubIcon {...iconProps} />
        </GithubLink>
        <TwitterLink href="https://twitter.com/alexandereardon">
          <TwitterIcon {...iconProps} />
        </TwitterLink>
      </Container>
    );
  }
}
