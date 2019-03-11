// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { storeKey, canLiftKey } from '../../../../src/view/context-keys';

export default class App extends React.Component<*> {
  // Part of reacts api is to use flow types for this.
  // Sadly cannot use flow
  static contextTypes = {
    [storeKey]: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }).isRequired,
    [canLiftKey]: PropTypes.func.isRequired,
  };

  render() {
    return <div>Hi there</div>;
  }
}
