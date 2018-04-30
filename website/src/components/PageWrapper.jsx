// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';
import Link from 'gatsby-link';
import { colors as akColors } from '@atlaskit/theme';
import Sidebar from './Sidebar';
import type { sitePage, docsPage } from './types';
import { colors, grid, sidebarWidth } from '../constants';

const Content = styled.div`

  margin-left: ${sidebarWidth + (grid * 2)}px;
  margin-top ${grid * 4}px;
  display: flex;
  justify-content: center;
`;

const ContentSpacing = styled.div`
background: lightgreen;
  max-width: 960px;
  width: 100%;
  min-height: 100vh;
`;

type Props = {
  examples: sitePage,
  docs: docsPage,
  internal: sitePage,
  showInternal: boolean,
  children: Node,
}

export default ({ examples, docs, internal, showInternal, children }: Props) => (
  <React.Fragment>
    {/* <Header><HeaderLink to="/" href="/">React-Beautiful-Dnd</HeaderLink></Header> */}
    <Sidebar examples={examples} docs={docs} internal={internal} showInternal={showInternal} />
    <Content>
      <ContentSpacing>
        {children}
      </ContentSpacing>
    </Content>
  </React.Fragment>
);
