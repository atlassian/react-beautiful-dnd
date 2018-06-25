/**
* @jest-environment node
*/
// @flow
import * as attributes from '../../src/view/data-attributes';

const puppeteer = require('puppeteer');

const urlSingleList: string = 'http://localhost:9002/iframe.html?selectedKind=single%20vertical%20list&selectedStory=basic';

const timeout: number = 60000;

/* To avoid async callback from jest.setTimeout */
jest.setTimeout(timeout);

type Selector = string;

const returnPositionAndText = async (page: Object, selector: Selector) =>
  page.$eval(selector, (el: ?HTMLElement) => {
    if (!el) {
      throw new Error(`Unable to find element for selector "${selector}"`);
    }

    if (!(el instanceof HTMLElement)) {
      throw new Error('Element returned not of type HTMLElement');
    }

    return {
      height: el.offsetHeight,
      left: el.offsetLeft,
      top: el.offsetTop,
      text: el.innerText,
    };
  });

/* Css selectors used */
const singleListContainer: string = `[${attributes.droppable}]`;
const firstCard: string = `[${attributes.dragHandle}]:nth-child(1)`;
const secondCard: string = `[${attributes.dragHandle}]:nth-child(2)`;

describe('Browser test: single vertical list with keyboard', () => {
  let browser;
  let page;
  beforeAll(async () => {
    /* args are supplied to avoid issues in Travis CI to launch chromium:
     https://github.com/GoogleChrome/puppeteer/issues/807 */
    browser = await puppeteer.launch({ headless: true, slowMo: 100, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    page = await browser.newPage();
    await page.goto(urlSingleList);
    await page.waitForSelector(singleListContainer);
  }, timeout);

  afterAll(async () => {
    await browser.close();
  });

  it('should be able to drag the first card under the second', async () => {
    /* Before drag */
    let inFirstPosition = await returnPositionAndText(page, firstCard);
    let inSecondPosition = await returnPositionAndText(page, secondCard);
    const beforeDragFirstCardContent = inFirstPosition.text;
    const beforeDragSecondCardContent = inSecondPosition.text;
    // Check
    // - Cards should not be at the same position
    // - Texts content should not be the same
    expect(inFirstPosition.top).toBeLessThan(inSecondPosition.top);
    expect(inFirstPosition.text).not.toBe(inSecondPosition.text);
    // Select first element and move to the second place
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    /* After drag first and second cards are swapped */
    inFirstPosition = await returnPositionAndText(page, firstCard);
    inSecondPosition = await returnPositionAndText(page, secondCard);
    const afterDragFirstCardContent = inFirstPosition.text;
    const afterDragSecondCardContent = inSecondPosition.text;
    // Check
    // - Texts content should not be the same after drag
    expect(beforeDragFirstCardContent).toEqual(afterDragSecondCardContent);
    expect(beforeDragSecondCardContent).toEqual(afterDragFirstCardContent);
  });
});
