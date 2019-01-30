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

const isInIframe: boolean = (() => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

class PopIframe extends React.Component<Props> {
  pop = () => {
    const top: typeof window = window.top;
    top.location.href = window.location.href;
  };
  render() {
    const action: ?Node = isInIframe ? (
      <Button onClick={this.pop}>
        Pop out of <code>{'<iframe/>'}</code> - <strong>it's faster 🔥</strong>
      </Button>
    ) : null;
    return (
      <React.Fragment>
        {action}
        {this.props.children}
      </React.Fragment>
    );
  }
}

const PopIframeDecorator = (storyFn: Function) => (
  <PopIframe>{storyFn()}</PopIframe>
);

export default PopIframeDecorator;
