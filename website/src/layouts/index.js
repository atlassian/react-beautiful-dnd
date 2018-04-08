// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';

import Header from '../components/Header';

const TemplateWrapper = ({ children }: { children: () => Node }) => (
  <div>
    <Helmet
      title="React-beautiful-dnd"
      meta={[
        { name: 'description', content: 'react-beautiful-dnd' },
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
      {children()}
    </div>
  </div>
);

export default TemplateWrapper;
