// @flow
import React from 'react';
import { Link } from 'gatsby';
import styled, { css } from 'react-emotion';
import { grid, sidebarWidth, colors } from '../../constants';
import type { DocsPage, MarkdownPage, SitePage } from '../types';
import { getTitleFromExamplePath } from '../../utils';
import Heading from './heading';
import type { NavLink } from './sidebar-types';
import ReorderableSection from './reorderable-section';

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
  padding-left: ${grid * 2}px;
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
  examples: SitePage,
  title: string,
};

const ExampleSection = ({ examples, title }: NavFromUrlsProps) => {
  const links: NavLink[] = examples.edges.map(
    (edge): NavLink => {
      const { path: href } = edge.node;
      const link: NavLink = {
        title: getTitleFromExamplePath(href, '/examples/'),
        href,
      };
      return link;
    },
  );

  return (
    <ReorderableSection
      title={title}
      links={links}
      hoverColor={colors.blue300}
    />
  );
};

type Props = {
  docs: DocsPage,
  examples: SitePage,
};

type DocsSectionProps = {
  title: string,
  directory: string,
  pages: MarkdownPage[],
};

const DocsSection = ({ title, pages, directory }: DocsSectionProps) => {
  const links: NavLink[] = pages
    .filter((page: MarkdownPage): boolean => directory === page.node.fields.dir)
    .map(
      (page: MarkdownPage): NavLink => {
        const { slug, title: pageTitle } = page.node.fields;
        const link: NavLink = {
          title: pageTitle,
          href: slug,
        };
        return link;
      },
    );

  return (
    <ReorderableSection
      title={title}
      links={links}
      hoverColor={colors.purple300}
    />
  );
};

export default ({ docs, examples }: Props) => (
  <Sidebar>
    <Section>
      <Heading />
    </Section>
    <Section>
      <NavItem
        key="get-started"
        href="/get-started"
        title="Get Started"
        isTitle
        hoverColor={colors.blue500}
      />
    </Section>
    <Section>
      <DocsSection pages={docs.edges} title="Guides" directory="guides" />
    </Section>
    <Section>
      <DocsSection pages={docs.edges} title="API" directory="api" />
    </Section>
    <Section>
      <ExampleSection examples={examples} title="Examples" />
    </Section>
  </Sidebar>
);
