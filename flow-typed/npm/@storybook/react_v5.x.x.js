// flow-typed signature: 68ee88c520cb9bb70866d8812664bc7b
// flow-typed version: 00c3a083ad/@storybook/react_v5.x.x/flow_>=v0.72.x

type NodeModule = typeof module;

declare module '@storybook/react' {
  declare type Context = { kind: string, story: string };
  declare type Renderable =
    | string
    | number
    | React$Element<any>
    | Iterable<?Renderable>;
  declare type RenderCallback = (
    context: Context
  ) => Renderable;
  declare type RenderFunction = () => Renderable;

  declare type StoryDecorator = (
    story: RenderFunction,
    context: Context
  ) => Renderable;

  declare type DecoratorParameters = {
    [key: string]: any,
  };

  declare interface Story {
    +kind: string;
    add(
      storyName: string,
      callback: RenderCallback,
      parameters?: DecoratorParameters
    ): Story;
    addDecorator(decorator: StoryDecorator): Story;
    addParameters(parameters: DecoratorParameters): Story;
  }

  declare interface StoryObject {
    name: string;
    render: RenderFunction;
  }

  declare interface StoryBucket {
    kind: string;
    filename: string;
    stories: Array<StoryObject>;
  }

  declare function addDecorator(decorator: StoryDecorator): void;
  declare function addParameters(parameters: DecoratorParameters): void;
  declare function clearDecorators(): void;
  declare function configure(fn: () => void, module: NodeModule): void;
  declare function setAddon(addon: Object): void;
  declare function storiesOf(name: string, module: NodeModule): Story;
  declare function storiesOf<T>(name: string, module: NodeModule): Story & T;
  declare function forceReRender(): void;

  declare function getStorybook(): Array<StoryBucket>;
}
