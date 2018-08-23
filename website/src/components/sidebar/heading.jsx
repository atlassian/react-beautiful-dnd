// @flow
import React from 'react';
import { Link } from 'gatsby';
import styled from 'react-emotion';
import { grid, colors } from '../../constants';
import Logo from '../logo';

const headingHeight = grid * 4;

const Heading = styled.h2`
  color: ${colors.green400};
  padding-left: ${grid * 2}px;
`;

const HeadingLink = styled(Link)`
  color: ${colors.green400};
  :hover,
  :active,
  :focus {
    color: ${colors.green300};
    background: ${props => props.hoverColor};
    text-decoration: none;
  }
  display: flex;
  align-items: center;
`;

const SmallLogo = styled(Logo)`
  height: ${headingHeight}px;
  padding-right: ${grid * 2}px;
`;

export default () => (
  <Heading>
    <HeadingLink to="/">
      <SmallLogo /> rbd
    </HeadingLink>
  </Heading>
);
