// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';

type Props = {
  children: Node,
};

const Button = styled.button`
  position: fixed;
  left: 0;
  bottom: 0;
  padding: 8px;
  font-size: 16px;
  margin: 8px;

  :hover {
    cursor: pointer;
  }
`;

const isSSR: boolean = typeof window === 'undefined';

const canPopOutOfIframe: boolean = (() => {
  if (isSSR) {
    return false;
  }
  try {
    // this can violate a same origin policy if on a different domain
    return window.self !== window.top;
  } catch (e) {
    // cannot pop out as it would violate the same origin policy
    return false;
  }
})();

const canPopIntoIframe: boolean = (() => {
  if (isSSR || canPopOutOfIframe) {
    return false;
  }
  // already the top level
  try {
    return window.self === window.top;
  } catch (e) {
    // would have been in an iframe that we cannot leave - this codepath should never be hit
    return false;
  }
})();

type State = {|
  isLoading: boolean,
|};

class PopIframe extends React.Component<Props, State> {
  state: State = {
    isLoading: false,
  };

  getButton = () => {
    if (canPopOutOfIframe) {
      return (
        <Button onClick={this.pop} disabled={this.state.isLoading}>
          Pop out of <code>{'<iframe/>'}</code> -{' '}
          <strong>it's faster 🔥</strong>
        </Button>
      );
    }

    if (canPopIntoIframe) {
      return (
        <Button onClick={this.pop} disabled={this.state.isLoading}>
          Pop into <code>{'<iframe/>'}</code> - <strong>it's slower 🐢</strong>
        </Button>
      );
    }

    return null;
  };

  pop = () => {
    if (!canPopOutOfIframe && !canPopIntoIframe) {
      return;
    }

    this.setState({
      isLoading: true,
    });

    if (canPopOutOfIframe) {
      const top: typeof window = window.top;
      top.location.href = window.location.href;
      return;
    }

    if (canPopIntoIframe) {
      const protocol: string = window.location.protocol; // http:
      const host: string = window.location.host; // react-beautiful-dnd.com
      const pathname: string = window.location.pathname; // iframe.html
      const search: string = window.location.search; // ?s=query

      const noPathname: string = `${protocol}//${host}/${search}`;

      window.location.href = noPathname;
    }
  };
  render() {
    return (
      <React.Fragment>
        {this.getButton()}
        {this.props.children}
      </React.Fragment>
    );
  }
}

const PopIframeDecorator = (storyFn: Function) => (
  <PopIframe>{storyFn()}</PopIframe>
);

export default PopIframeDecorator;
