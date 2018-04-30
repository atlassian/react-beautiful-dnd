// @flow
import React, { Fragment } from 'react';
import Link from 'gatsby-link';
import styled, { css } from 'styled-components';
import { colors as akColors } from '@atlaskit/theme';
import { colors } from '../../constants';
import type { docsPage, sitePage } from '../types';
import { getTitleFromExamplePath } from '../../utils';

const Sidebar = styled.div`
  min-height: 100vh;
  min-width: 128px;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 64px;
  border-right: 2px solid ${colors.grey.darker};
`;

const NavItemStyles = css`
  padding-bottom: 8px;
  margin: 0;
`;

const H1 = styled.h1`
  ${NavItemStyles} font-size: 20px;
`;
const H2 = styled.h2`
  ${NavItemStyles} font-size: 12px;
`;

const StyledLink = styled(Link)`
  color: ${akColors.N600};

  :hover {
    color: ${({ hoverColor }) => (hoverColor || akColors.P300)};
  }
`;

type NavItemProps = {
  level: number,
  href: string,
  title: string,
  hoverColor?: string
}

const NavItem = ({ level, href, title, hoverColor }: NavItemProps) => {
  const Heading = level === 1 ? H1 : H2;
  return (
    <StyledLink hoverColor={hoverColor} to={href} href={href}>
      <div style={{ width: '100%' }}>
        <Heading>
          {title}
        </Heading>
      </div>
    </StyledLink>
  );
};

type NavFromUrlsProsp = {
  pages: sitePage,
  href: string,
  title: string,
}

const NavFromUrls = ({ pages, href, title }: NavFromUrlsProsp) => (
  <Fragment>
    <NavItem hoverColor={akColors.Y300} level={1} href={href} title={title} />
    {pages.edges.map((page) => {
    const { path } = page.node;
    return (
      <NavItem
        key={path}
        hoverColor={akColors.Y300}
        level={2}
        href={path}
        title={getTitleFromExamplePath(path, href)}
      />
    );
  })}
  </Fragment>
);

type Props = {
  docs: docsPage,
  examples: sitePage,
  internal: sitePage,
  showInternal: boolean,
}

export default ({ docs, examples, internal, showInternal }: Props) => (
  <Sidebar>
    <NavItem level={1} href="/documentation" title="Documentation" />
    {docs.edges.map((page) => {
      const { slug, title } = page.node.fields;
      return <NavItem key={slug} level={2} href={slug} title={title} />;
    })}
    <NavFromUrls href="/examples/" title="Examples" pages={examples} />
    {showInternal ? <NavFromUrls href="/internal/" title="Internal Examples" pages={internal} /> : null}
  </Sidebar>
);
