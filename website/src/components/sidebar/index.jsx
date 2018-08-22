// @flow
import React, { Fragment } from 'react';
import { Link } from 'gatsby';
import styled, { css } from 'react-emotion';
import { colors as akColors } from '@atlaskit/theme';
import { grid, sidebarWidth } from '../../constants';
import type { docsPage, sitePage, innerDocsPage } from '../types';
import { getTitleFromExamplePath } from '../../utils';

const Sidebar = styled.div`
  height: 100vh;
  width: ${sidebarWidth}px;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  background: ${akColors.G50};
  overflow: auto;
  padding-bottom: ${grid * 2}px;

  ::-webkit-scrollbar {
    width: ${grid}px;
  }

  ::-webkit-scrollbar-track {
    background-color: pink;
  }

  ::-webkit-scrollbar-thumb {
    background-color: darkgrey;
  }
`;

const Section = styled.div`
  margin-top: ${grid * 3}px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 20px;
  padding: ${grid}px;
  padding-left ${grid * 2}px;
`;
const Item = styled.h4`
  padding: ${grid}px;
  padding-left: ${grid * 3}px;
`;

const StyledLink = styled(Link)`
  color: ${akColors.N600};
  transition: background-color ease 0.2s, color ease 0.2s;

  ${props =>
    props.isActiveLink
      ? css`
          color: white;
          background: ${props.hoverColor};
          text-decoration: none;
        `
      : ''} :hover, :active, :focus {
    color: white;
    background: ${props => props.hoverColor};
    text-decoration: none;
  }
`;

type NavItemProps = {|
  href: string,
  title: string,
  hoverColor: string,
  isTitle?: boolean,
|};

const NavItem = ({ isTitle, href, title, hoverColor }: NavItemProps) => {
  const isActiveLink = window.location.pathname === href;
  const Wrapper = isTitle ? Title : Item;
  return (
    <StyledLink
      hoverColor={hoverColor}
      to={href}
      href={href}
      isActiveLink={isActiveLink}
    >
      <Wrapper>{title}</Wrapper>
    </StyledLink>
  );
};

type NavFromUrlsProps = {
  pages: sitePage,
  href: string,
  title: string,
};

const NavFromUrls = ({ pages, href, title }: NavFromUrlsProps) => (
  <Fragment>
    <Title>{title}</Title>
    {pages.edges.map(page => {
      const { path } = page.node;
      return (
        <NavItem
          key={path}
          hoverColor={akColors.Y300}
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
};

type DocsSectionProps = {
  sectionTitle: string,
  sectionDir: string,
  pages: Array<innerDocsPage>,
};

const DocsSection = ({ sectionTitle, pages, sectionDir }: DocsSectionProps) => (
  <Fragment>
    <Title>{sectionTitle}</Title>
    {pages.map(page => {
      const { slug, title, dir } = page.node.fields;
      if (sectionDir === dir) {
        return (
          <NavItem
            key={slug}
            href={slug}
            title={title}
            hoverColor={akColors.B300}
          />
        );
      }
      return null;
    })}
  </Fragment>
);

export default ({ docs, examples, internal }: Props) => (
  <Sidebar>
    <h2>Header goes here</h2>
    <Section>
      <DocsSection
        pages={docs.edges}
        sectionTitle="Quick Start"
        sectionDir="quick-start"
      />
    </Section>
    <Section>
      <DocsSection
        pages={docs.edges}
        sectionTitle="Core Concepts"
        sectionDir="core-concepts"
      />
    </Section>
    <Section>
      <DocsSection
        pages={docs.edges}
        sectionTitle="Guides"
        sectionDir="guides"
      />
    </Section>
    <Section>
      <NavFromUrls href="/examples/" title="Examples" pages={examples} />
    </Section>
  </Sidebar>
);
