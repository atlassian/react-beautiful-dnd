// @flow
const puppeteer = require('puppeteer');
const { singleListContainer, firstCard, secondCard } = require('./../utils/css.js');

const urlSingleList = 'http://localhost:9002/iframe.html?selectedKind=single%20vertical%20list&selectedStory=basic';

const timeout = 30000;

const returnPositionAndText = async (page, elem) =>
  page.$$eval(elem, el =>
    ({
      height: el[0].offsetHeight,
      left: el[0].offsetLeft,
      top: el[0].offsetTop,
      text: el[0].innerText,
    }));

describe('Single List > ', () => {
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
    let firstPosition = await returnPositionAndText(page, firstCard);
    let secondPosition = await returnPositionAndText(page, secondCard);
    const beforeDragFirstCardContent = firstPosition.text;
    const beforeDragSecondCardContent = secondPosition.text;
    // Check
    // - Cards should not be at the same position
    // - Texts content should not be the same
    expect(firstPosition.top).toBeLessThan(secondPosition.top);
    expect(firstPosition.text).not.toBe(secondPosition.text);
    // Select first element and move to the second place
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    /* After drag first and second cards are swapped */
    firstPosition = await returnPositionAndText(page, firstCard);
    secondPosition = await returnPositionAndText(page, secondCard);
    const afterDragFirstCardContent = firstPosition.text;
    const afterDragSecondCardContent = secondPosition.text;
    // Check
    // - Texts content should not be the same after drag
    expect(beforeDragFirstCardContent).toEqual(afterDragSecondCardContent);
    expect(beforeDragSecondCardContent).toEqual(afterDragFirstCardContent);
  });
});
