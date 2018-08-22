// @flow
import React from 'react';
import NestedQuoteApp from '../../components/examples/vertical-nested/quote-app';
import GroupedQuoteApp from '../../components/examples/vertical-grouped/quote-app';
import { authorQuoteMap } from '../../components/examples/data';
import Layout from '../../components/layouts/example';

type Props = {
  location: {
    pathname: string,
  },
};

export default (props: Props) => (
  <Layout location={props.location}>
    <div>Grouped</div>
    <GroupedQuoteApp initial={authorQuoteMap} />
    <div>nested vertical lists</div>
    <NestedQuoteApp />
  </Layout>
);
