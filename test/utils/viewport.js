// @flow
import type {
  Area,
  Viewport,
  Position,
} from '../../src/types';
import getViewport from '../../src/view/window/get-viewport';
import getMaxScroll from '../../src/state/get-max-scroll';
import { offsetByPosition } from '../../src/state/spacing';
import { subtract, negate } from '../../src/state/position';
import getArea from '../../src/state/get-area';

const getDoc = (): HTMLElement => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    throw new Error('Unable to get document.documentElement');
  }

  return el;
};

export const setViewport = (custom: Viewport) => {
  if (custom.scroll.x !== custom.subject.left) {
    throw new Error('scroll x must match left of subject');
  }
  if (custom.scroll.y !== custom.subject.top) {
    throw new Error('scroll y must match top of subject');
  }

  window.pageYOffset = custom.scroll.y;
  window.pageXOffset = custom.scroll.x;

  const doc: HTMLElement = getDoc();
  doc.clientWidth = custom.subject.width;
  doc.clientHeight = custom.subject.height;

  // reverse engineering these values
  const scrollHeight: number = custom.maxScroll.y + custom.subject.height;
  const scrollWidth: number = custom.maxScroll.x + custom.subject.width;

  doc.scrollHeight = scrollHeight;
  doc.scrollWidth = scrollWidth;
};

export const getCurrent = (): Viewport => getViewport();

const original: Viewport = getCurrent();

export const resetViewport = () => setViewport(original);

type CreateViewportArgs = {|
  subject: Area,
  scroll: Position,
  scrollHeight: number,
  scrollWidth: number,
|}

export const createViewport = ({
  subject,
  scroll,
  scrollHeight,
  scrollWidth,
}: CreateViewportArgs): Viewport => {
  const viewport: Viewport = {
    subject,
    scroll,
    maxScroll: getMaxScroll({
      scrollHeight,
      scrollWidth,
      width: subject.width,
      height: subject.height,
    }),
  };
  return viewport;
};

type WithWindowScrollSizeArgs = {|
  viewport: Viewport,
  scrollWidth: number,
  scrollHeight: number,
|}

export const withWindowScrollSize = ({
  viewport,
  scrollWidth,
  scrollHeight,
}: WithWindowScrollSizeArgs): Viewport =>
  createViewport({
    subject: viewport.subject,
    scroll: viewport.scroll,
    scrollHeight,
    scrollWidth,
  });

export const scrollViewport = (viewport: Viewport, newScroll: Position) => {
  const diff: Position = subtract(viewport.scroll, newScroll);
  const displacement: Position = negate(diff);

  // reverse engineering these values
  const scrollHeight: number = viewport.maxScroll.y + viewport.subject.height;
  const scrollWidth: number = viewport.maxScroll.x + viewport.subject.width;

  return createViewport({
    subject: getArea(offsetByPosition(viewport.subject, displacement)),
    scroll: newScroll,
    scrollHeight,
    scrollWidth,
  });
};
