// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import FeedbackIcon from '@atlaskit/icon/glyph/feedback';
import { grid } from '../../layouts/constants';

const isMutationObserverSupported: boolean = typeof MutationObserver !== 'undefined';

const Container = styled.div`
  background-color: ${colors.T300};
  color: ${colors.N0};
  padding: ${grid}px;
  width: 300px;
  min-height: 100px;
  border-radius: 3px;
  text-align: center;

  /* pull out of the document flow*/
  position: absolute;
  top: 0;
  right: 0;
  margin-top: ${grid}px;
  margin-right: ${grid}px;

  /* Super basic: just hiding on smaller screens */

  @media screen and (max-width: 1200px) {
    display: none;
  }
`;

const Title = styled.h4`
  margin-bottom: ${grid}px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TitleIcon = styled.span`
  margin-left: ${grid}px;
`;

const Speach = styled.div`
`;

const defaultMessage: string = `
  (This is what the screen reader will announce)
`;

type State = {|
  message: ?string,
|}

export default class ScreenReaderWatcher extends React.Component<*, State> {
  observer: ?MutationObserver

  state: State = {
    message: null,
  }
  componentDidMount() {
    const target: ?HTMLElement = document.getElementById('react-beautiful-dnd-announcement-0');

    if (!target) {
      console.error('Could not find screen reader target');
      return;
    }

    this.observer = new MutationObserver(this.onMutation);
    this.observer.observe(target, { childList: true });

    window.addEventListener('focusin', this.onWindowFocus, { passive: true });
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }

    window.removeEventListener('focusin', this.onWindowFocus, { passive: true });
  }

  onMutation = (records: MutationRecord[]) => {
    if (!records.length) {
      return;
    }

    const last: Node = records[records.length - 1].target;

    this.setState({
      message: last.innerText,
    });
  }

  onWindowFocus = (event: FocusEvent) => {
    const target: EventTarget = event.target;

    if (!(target instanceof HTMLElement)) {
      this.setState({ message: null });
      return;
    }

    const isDragHandle: boolean = target.hasAttribute('data-react-beautiful-dnd-drag-handle');

    if (!isDragHandle) {
      this.setState({ message: null });
      return;
    }

    const content: string = (target.innerText || '').trim();
    const description: string = (target.getAttribute('aria-roledescription') || '').trim();

    const message: string = `${content}, ${description}`;

    this.setState({
      message,
    });
  }

  render() {
    if (!isMutationObserverSupported) {
      return null;
    }

    return (
      <Container isReady={Boolean(this.observer)}>
        <Title>
          Screen reader announcement
          <TitleIcon>
            <FeedbackIcon
              label="speaker icon"
              size="large"
            />
          </TitleIcon>
        </Title>
        <Speach>{this.state.message || defaultMessage}</Speach>
      </Container>
    );
  }
}
