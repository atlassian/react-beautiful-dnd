// @flow
import React from 'react';
import Board from '../../components/examples/board/board';
import {
  authorQuoteMap,
  generateQuoteMap,
} from '../../components/examples/data';
import Layout from '../../components/layouts/example';

const data = {
  medium: generateQuoteMap(100),
  large: generateQuoteMap(500),
};

type Props = {
  location: {
    pathname: string,
  },
};

export default (props: Props) => (
  <Layout location={props.location}>
    <div>Board</div>
    <Board initial={authorQuoteMap} />
    <div>Medium Data Set</div>
    <div>
      <Board initial={data.medium} />
    </div>
    <div>Large Data Set</div>
    <Board initial={data.large} />
    <div>long lists in a short container</div>
    <Board initial={data.medium} containerHeight="60vh" />
  </Layout>
);
