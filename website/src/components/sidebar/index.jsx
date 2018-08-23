// @flow
import React, { Fragment } from 'react';
import { Link } from 'gatsby';
import styled, { css } from 'react-emotion';
import { grid, sidebarWidth, colors } from '../../constants';
import type { docsPage, sitePage, innerDocsPage } from '../types';
import { getTitleFromExamplePath } from '../../utils';
import Heading from './heading';

const Sidebar = styled.div`
  height: 100vh;
  width: ${sidebarWidth}px;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  overflow: auto;
  padding-bottom: ${grid * 2}px;
  background: ${colors.dark500};

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
  color: ${colors.dark200};
  transition: background-color ease 0.2s, color ease 0.2s;

  ${props =>
    props.isActiveLink
      ? css`
          color: ${colors.dark100};
          background: ${props.hoverColor};
          text-decoration: none;
        `
      : ''} :hover, :active, :focus {
    color: ${colors.dark100};
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
          hoverColor={colors.green500}
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
            hoverColor={colors.purple500}
          />
        );
      }
      return null;
    })}
  </Fragment>
);

export default ({ docs, examples }: Props) => (
  <Sidebar>
    <Section>
      <Heading />
    </Section>
    <Section>
      <NavItem
        key="getting-started"
        href="/getting-started"
        title="Getting Started"
        isTitle
        hoverColor={colors.blue500}
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
      <DocsSection pages={docs.edges} sectionTitle="API" sectionDir="api" />
    </Section>
    <Section>
      <NavFromUrls href="/examples/" title="Examples" pages={examples} />
    </Section>
  </Sidebar>
);
