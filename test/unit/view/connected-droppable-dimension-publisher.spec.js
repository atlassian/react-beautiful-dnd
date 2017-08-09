// @flow
import { makeSelector } from '../../../src/view/droppable-dimension-publisher/connected-droppable-dimension-publisher';
import type { MapProps } from '../../../src/view/droppable-dimension-publisher/droppable-dimension-publisher-types';

const defaultMapProps: MapProps = {
  shouldPublish: false,
};

const shouldPublishMapProps: MapProps = {
  shouldPublish: true,
};

describe('Dimension publisher - connected', () => {
  it('should return the default props when not requested to publish dimensions', () => {
    const selector = makeSelector();

    const result: MapProps = selector.resultFunc(
      'DEFAULT',
      null,
    );

    expect(result).toEqual(defaultMapProps);
  });

  it('should return the default props when the type being requested does not match the current publisher', () => {
    const selector = makeSelector();

    const result: MapProps = selector.resultFunc(
      'MY_TYPE',
      'SOME_OTHER_TYPE',
    );

    expect(result).toEqual(defaultMapProps);
  });

  it('should return that it should publish when the requested type matches', () => {
    const selector = makeSelector();

    const result: MapProps = selector.resultFunc(
      'MY_TYPE',
      'MY_TYPE',
    );

    expect(result).toEqual(shouldPublishMapProps);
  });

  it('should not break memoization on multiple do not publish results', () => {
    const selector = makeSelector();

    // nothing requested
    const result1: MapProps = selector.resultFunc(
      'MY_TYPE',
      null,
    );
    const result2: MapProps = selector.resultFunc(
      'MY_TYPE',
      null,
    );
    // something else requested
    const result3: MapProps = selector.resultFunc(
      'MY_TYPE',
      'NOT_MY_TYPE',
    );
    const result4: MapProps = selector.resultFunc(
      'MY_TYPE',
      'ANOTHER_TYPE_THAT_IS_NOT_MINE',
    );

    // correct result returned?
    expect(result1).toEqual(defaultMapProps);
    // checking object equality
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result3).toBe(result4);
  });

  it('should not break memoization across multiple selectors', () => {
    const shouldPublishSelector = makeSelector();
    const noPublishSelector = makeSelector();

    const shouldPublish1: MapProps = shouldPublishSelector.resultFunc(
      'MY_TYPE',
      'MY_TYPE',
    );
    const noPublish1: MapProps = noPublishSelector.resultFunc(
      'MY_TYPE',
      'NOT_MY_TYPE',
    );
    const shouldPublish2: MapProps = shouldPublishSelector.resultFunc(
      'MY_TYPE',
      'MY_TYPE',
    );
    const noPublish2: MapProps = noPublishSelector.resultFunc(
      'MY_TYPE',
      'NOT_MY_TYPE',
    );

    expect(shouldPublish1).toBe(shouldPublish2);
    expect(noPublish1).toBe(noPublish2);
  });
});
