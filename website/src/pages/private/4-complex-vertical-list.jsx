// @flow
import React from 'react';
import NestedQuoteApp from '../../components/examples/vertical-nested/quote-app';
import GroupedQuoteApp from '../../components/examples/vertical-grouped/quote-app';
import { authorQuoteMap } from '../../components/examples/data';

export default () => (
  <div>
    <div>Grouped</div>
    <GroupedQuoteApp initial={authorQuoteMap} />
    <div>nested vertical lists</div>
    <NestedQuoteApp />
  </div>
);
