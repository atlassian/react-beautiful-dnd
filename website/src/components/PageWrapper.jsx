// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';
import Link from 'gatsby-link';
import { colors as akColors } from '@atlaskit/theme';
import Sidebar from './Sidebar';
import type { sitePage, docsPage } from './types';
import { colors, grid } from '../constants';

const Contents = styled.div`
  min-height: 100vh;
  width: 600px;
  padding: 64px;
`;

const Wrapper = styled.div`
  background-color: ${colors.blue.deep};
`;

const Content = styled.div`
  max-width: 800px;
  background-color: white;
  margin: auto;
  display: flex;
  flex-direction: row;
  border-top-left-radius: ${grid}px;
  border-top-right-radius: ${grid}px;
`;

const HeaderLink = styled(Link)`
  margin: 0 ${grid}px;
  padding: ${grid * 1}px ${grid * 2}px;
  color: ${akColors.N10};
  font-weight: bold;
  user-select: none;
  box-sizing: border-box;

  /* used to align the text next to the icon */
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    cursor: pointer;
    text-decoration: none;
    color: ${akColors.N10};
  }
`;

const Header = styled.div`
  max-width: ${grid * 100}px;
  margin: auto;
  font-family: 'Clicker Script', cursive;
  font-weight: normal;
  font-size: ${grid * 5}px;
  color: white;
  text-align: center;
`;

type Props = {
  examples: sitePage,
  docs: docsPage,
  internal: sitePage,
  showInternal: boolean,
  children: Node,
}

export default ({ examples, docs, internal, showInternal, children }: Props) => (
  <Wrapper>
    <Header><HeaderLink to="/" href="/">React-Beautiful-Dnd</HeaderLink></Header>
    <Content>
      <Sidebar examples={examples} docs={docs} internal={internal} showInternal={showInternal} />
      <Contents>{children}</Contents>
    </Content>
  </Wrapper>
);
