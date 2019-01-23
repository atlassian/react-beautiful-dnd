// @flow
import { JSDOM } from 'jsdom';
import isHtmlElement from '../../../../src/view/is-type-of-element/is-html-element';
import isSvgElement from '../../../../src/view/is-type-of-element/is-svg-element';
import getSvg from './util/get-svg';

it('should allow html elements through', () => {
  const anchor: HTMLElement = document.createElement('a');

  expect(isHtmlElement(anchor)).toBe(true);
  // validation
  expect(anchor instanceof HTMLElement).toBe(true);
});

it('should not allow svg elements through', () => {
  // $FlowFixMe - does not know what SVGElement is
  const svg: SVGElement = getSvg(document);

  expect(isHtmlElement(svg)).toBe(false);
  // validation
  expect(svg instanceof SVGElement).toBe(true);
  expect(isSvgElement(svg)).toBe(true);
});

it('should allow html elements from another window', () => {
  const other = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
  const anchor: HTMLElement = other.window.document.createElement('a');

  // normally would not pass an instanceof check
  expect(anchor instanceof HTMLElement).toBe(false);
  expect(anchor instanceof other.window.HTMLElement).toBe(true);

  // passes our html element check
  expect(isHtmlElement(anchor)).toBe(true);
});

it('should not allow svg elements from another window', () => {
  const other = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
  const svg: HTMLElement = getSvg(other.window.document);

  expect(isHtmlElement(svg)).toBe(false);
  // validation
  // $FlowFixMe - does not know what SVGElement is
  expect(svg instanceof SVGElement).toBe(false);
  expect(svg instanceof other.window.SVGElement).toBe(true);
  expect(isSvgElement(svg)).toBe(true);
});
