// @flow

type renderBodyParams = { setHeadComponents: (any[]) => mixed };

const React = require('react');
// $FlowFixMe - Somehow flow doesnt like ico files
const faviconIco = require('./src/assets/favicon.ico');
const favicon16 = require('./src/assets/favicon-16x16.png');
const favicon32 = require('./src/assets/favicon-32x32.png');

exports.onRenderBody = ({ setHeadComponents }: renderBodyParams) =>
  setHeadComponents([
    <link
      key="ie-favicon"
      rel="shortcut icon"
      type="image/x-icon"
      href={faviconIco}
    />,
    <link key="small-favicon" rel="icon" href={favicon16} />,
    <link key="large-favicon" rel="icon" href={favicon32} />,
  ]);
