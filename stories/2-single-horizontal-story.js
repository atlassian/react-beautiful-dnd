// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import AuthorApp from './src/horizontal/author-app';
import { authors, getAuthors } from './src/data';
import type { Author } from './src/types';

const bigData: Author[] = getAuthors(30);

const WideWindow = styled.div`
  width: 120vw;
`;

storiesOf('horizontal list reordering', module)
  .add('simple example', () => (
    <AuthorApp initial={authors} />
  ))
  .add('with overflow scroll', () => (
    <AuthorApp initial={bigData} overflow="auto" />
  ))
  .add('with window scroll and overflow scroll', () => (
    <WideWindow>
      <AuthorApp initial={bigData} overflow="auto" />
    </WideWindow>
  ));
