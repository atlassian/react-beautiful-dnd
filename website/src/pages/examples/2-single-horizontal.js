// @flow
import React from 'react';
import styled from 'styled-components';
import AuthorApp from '../../components/examples/horizontal/author-app';
import { quotes, getQuotes } from '../../components/examples/data';
import type { Quote } from '../../components/examples/types';

const bigData: Quote[] = getQuotes(30);

const WideWindow = styled.div`
  width: 120vw;
`;

export default () => (
  <div>
    <div>Simple Example</div>
    <AuthorApp initial={quotes} />
    <div>With Overflow Scroll</div>
    <AuthorApp initial={bigData} internalScroll />
    <div>With WIndow Scroll and overflow scroll</div>
    <WideWindow>
      <AuthorApp initial={bigData} internalScroll />
    </WideWindow>
  </div>
);
