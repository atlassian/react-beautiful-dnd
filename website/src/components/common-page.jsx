// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';
import { colors, lineHeight, fontSizeEm } from '../constants';
import { version } from '../../../package.json';

type Props = {
  children: Node,
};

const globalStyles = `
  body {
    color: ${colors.dark100};
    background: ${colors.dark400};
    line-height: ${lineHeight};
    font-size: ${fontSizeEm}em;
  }
`;

/* eslint-disable no-console */
class EnvLogger extends React.Component<*> {
  componentDidMount() {
    // Doing this more complex check as console.table || console.log makes CI cry
    const table: Function = Object.prototype.hasOwnProperty.call(
      console,
      'table',
    )
      ? console.table
      : console.log;

    console.log('environment');
    table([
      ['react-beautiful-dnd version', version],
      ['react version', React.version],
      ['process.env.NODE_ENV', process.env.NODE_ENV],
    ]);
  }
  render() {
    return null;
  }
}

const CommonPage = ({ children }: Props) => (
  <React.Fragment>
    <Helmet>
      <title>react-beautiful-dnd</title>
      <meta
        name="description"
        content="react-beautiful-dnd: Beautiful and accessible drag and drop for lists with React"
      />
      <style data-global-styles>{globalStyles}</style>
    </Helmet>
    <EnvLogger />
    {children}
  </React.Fragment>
);

export default CommonPage;
