// @flow
import React from 'react';
import { Link } from 'gatsby';
import styled from 'react-emotion';
import GithubIcon from 'react-icons/lib/fa/github';
import { grid, colors, gutter } from '../../constants';
import spacing from './spacing';
import Logo from '../logo';

const iconSize: number = grid * 4;

const Container = styled.div`
  display: flex;
`;

const Title = styled.h2`
  margin: 0;
`;

const transitionColor = `transition: color 0.2s ease`;

const HomeLink = styled(Link)`
  padding: ${gutter.normal}px;
  /* same as a section */
  padding-top: ${spacing.top}px;
  color: ${colors.green400};
  ${transitionColor};
  :hover,
  :active,
  :focus {
    color: ${colors.green300};
    text-decoration: none;
  }

  /* flex child: fill up as much horizontal space as you can */
  flex-grow: 1;

  /* flex parent */
  display: flex;
  align-items: center;
`;

const SmallLogo = styled(Logo)`
  height: ${iconSize}px;
  padding-right: ${gutter.normal}px;
  flex-grow: 0;
`;

const GithubLink = styled.a`
  display: block;
  color: ${colors.dark100};
  padding: ${gutter.normal}px;
  /* same as a section */
  padding-top: ${spacing.top}px;
  ${transitionColor};

  :hover,
  :active,
  :focus {
    color: ${colors.green300};
    text-decoration: none;
  }
`;

export default () => (
  <Container>
    <HomeLink to="/">
      <SmallLogo />
      <Title>rbd</Title>
    </HomeLink>
    <GithubLink href="https://github.com/atlassian/react-beautiful-dnd">
      <GithubIcon height={iconSize} width={iconSize} />
    </GithubLink>
  </Container>
);
