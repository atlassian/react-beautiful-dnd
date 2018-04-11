// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';

import Header from '../components/header';

type Props = {
  children: Node,
}

export default class PageTemplate extends React.Component<Props> {
  render() {
    return (
      <div>
        <Helmet
          title="react-beautiful-dnd"
          meta={[
            { name: 'description', content: 'react-beautiful-dnd: Beautiful, accessible drag and drop for lists with React.js' },
          ]}
        />
        <Header />
        <div
          style={{
            margin: '0 auto',
            maxWidth: 960,
            padding: '0px 1.0875rem 1.45rem',
            paddingTop: 0,
          }}
        >
          Children go here
          {this.props.children}
        </div>
      </div>
    );
  }
}
