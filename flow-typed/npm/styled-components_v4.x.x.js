// flow-typed signature: 8ae4cfa383fc58443d8d65b5301bf1c1
// flow-typed version: 1a7d5ca288/styled-components_v4.x.x/flow_>=v0.75.x

// @flow

declare module 'styled-components' {

  declare export type Interpolation =
                                    | (<P: {}>(executionContext: P) => string)
                                    | CSSRules
                                    | KeyFrames
                                    | string
                                    | number


  declare export type CSSRules = Interpolation[]

  // This is not exported on purpose, since it's an implementation detail
  declare type TaggedTemplateLiteral<R> = (strings : string[], ...interpolations : Interpolation[]) => R

  declare export type CSSConstructor = TaggedTemplateLiteral<CSSRules>
  declare export type KeyFramesConstructor = TaggedTemplateLiteral<KeyFrames>
  declare export type CreateGlobalStyleConstructor = TaggedTemplateLiteral<React$ComponentType<*>>

  declare interface Tag<T> {
    styleTag: HTMLStyleElement | null;
    getIds(): string[];
    hasNameForId(id: string, name: string): boolean;
    insertMarker(id: string): T;
    insertRules(id: string, cssRules: string[], name: ?string): void;
    removeRules(id: string): void;
    css(): string;
    toHTML(additionalAttrs: ?string): string;
    toElement(): React$Element<*>;
    clone(): Tag<T>;
    sealed: boolean;
  }

  // The `any`/weak types in here all come from `styled-components` directly, since those definitions were just copied over
  declare export class StyleSheet {
    static get master() : StyleSheet;
    static get instance() : StyleSheet;
    static reset(forceServer? : boolean) : void;

    id : number;
    forceServer : boolean;
    target : ?HTMLElement;
    tagMap : {[string]: Tag<any>}; // eslint-disable-line flowtype/no-weak-types
    deferred: { [string]: string[] | void };
    rehydratedNames: { [string]: boolean };
    ignoreRehydratedNames: { [string]: boolean };
    tags: Tag<any>[]; // eslint-disable-line flowtype/no-weak-types
    importRuleTag: Tag<any>; // eslint-disable-line flowtype/no-weak-types
    capacity: number;
    clones: StyleSheet[];

    constructor(?HTMLElement) : this;
    rehydrate() : this;
    clone() : StyleSheet;
    sealAllTags() : void;
    makeTag(tag : ?Tag<any>) : Tag<any>; // eslint-disable-line flowtype/no-weak-types
    getImportRuleTag() : Tag<any>; // eslint-disable-line flowtype/no-weak-types
    getTagForId(id : string): Tag<any>; // eslint-disable-line flowtype/no-weak-types
    hasId(id: string) : boolean;
    hasNameForId(id: string, name: string) : boolean;
    deferredInject(id : string, cssRules : string[]) : void;
    inject(id: string, cssRules : string[], name? : string) : void;
    remove(id : string) : void;
    toHtml() : string;
    toReactElements() : React$ElementType[];
  }

  declare export class KeyFrames {
    id : string;
    name : string;
    rules : string[];

    constructor(name : string, rules : string[]) : this;
    inject(StyleSheet) : void;
    toString() : string;
    getName() : string;
  }

  // I think any is appropriate here?
  // eslint-disable-next-line flowtype/no-weak-types
  declare export type Theme = {+[string] : any}

  declare export var css : CSSConstructor;
  declare export var keyframes : KeyFramesConstructor;
  declare export var createGlobalStyle : CreateGlobalStyleConstructor
  declare export var ThemeProvider : React$ComponentType<{children?: ?React$Node, theme : Theme | (Theme) => Theme}>

  // This is a bit hard to read. Not sure how to make it more readable. I think adding line-breaks makes it worse.
  declare type InjectedProps = { theme : Theme | void }
  declare  export function withTheme<Props : {}, Component: React$ComponentType<Props>>(WrappedComponent: Component) : React$ComponentType<$Diff<React$ElementConfig<$Supertype<Component>>, InjectedProps>>;


  // @HACK This is a cheat to hide that the underlying type is "just a string"
  //       once we know of a better way, we should be able to update this accordingly.
  //       I don't think there _is_ a good way, currently.
  // @NOTE Also not too sure about the naming of this...
  declare export type StyledElementType<T> = T;
  declare export type StyledComponentType<C> = {
    [[call]]: TaggedTemplateLiteral<C>,
    +attrs: <A: {}>(attributes: A | (props: React$ElementConfig<C>) => A) => TaggedTemplateLiteral<React$ComponentType<$Diff<React$ElementConfig<C>, A>>>
  };

  declare type StyledComponentList = {
    a:                        StyledComponentType<StyledElementType<'a'>>,
    abbr:                     StyledComponentType<StyledElementType<'abbr'>>,
    address:                  StyledComponentType<StyledElementType<'address'>>,
    area:                     StyledComponentType<StyledElementType<'area'>>,
    article:                  StyledComponentType<StyledElementType<'article'>>,
    aside:                    StyledComponentType<StyledElementType<'aside'>>,
    audio:                    StyledComponentType<StyledElementType<'audio'>>,
    b:                        StyledComponentType<StyledElementType<'b'>>,
    base:                     StyledComponentType<StyledElementType<'base'>>,
    bdi:                      StyledComponentType<StyledElementType<'bdi'>>,
    bdo:                      StyledComponentType<StyledElementType<'bdo'>>,
    big:                      StyledComponentType<StyledElementType<'big'>>,
    blockquote:               StyledComponentType<StyledElementType<'blockquote'>>,
    body:                     StyledComponentType<StyledElementType<'body'>>,
    br:                       StyledComponentType<StyledElementType<'br'>>,
    button:                   StyledComponentType<StyledElementType<'button'>>,
    canvas:                   StyledComponentType<StyledElementType<'canvas'>>,
    caption:                  StyledComponentType<StyledElementType<'caption'>>,
    cite:                     StyledComponentType<StyledElementType<'cite'>>,
    code:                     StyledComponentType<StyledElementType<'code'>>,
    col:                      StyledComponentType<StyledElementType<'col'>>,
    colgroup:                 StyledComponentType<StyledElementType<'colgroup'>>,
    data:                     StyledComponentType<StyledElementType<'data'>>,
    datalist:                 StyledComponentType<StyledElementType<'datalist'>>,
    dd:                       StyledComponentType<StyledElementType<'dd'>>,
    del:                      StyledComponentType<StyledElementType<'del'>>,
    details:                  StyledComponentType<StyledElementType<'details'>>,
    dfn:                      StyledComponentType<StyledElementType<'dfn'>>,
    dialog:                   StyledComponentType<StyledElementType<'dialog'>>,
    div:                      StyledComponentType<StyledElementType<'div'>>,
    dl:                       StyledComponentType<StyledElementType<'dl'>>,
    dt:                       StyledComponentType<StyledElementType<'dt'>>,
    em:                       StyledComponentType<StyledElementType<'em'>>,
    embed:                    StyledComponentType<StyledElementType<'embed'>>,
    fieldset:                 StyledComponentType<StyledElementType<'fieldset'>>,
    figcaption:               StyledComponentType<StyledElementType<'figcaption'>>,
    figure:                   StyledComponentType<StyledElementType<'figure'>>,
    footer:                   StyledComponentType<StyledElementType<'footer'>>,
    form:                     StyledComponentType<StyledElementType<'form'>>,
    h1:                       StyledComponentType<StyledElementType<'h1'>>,
    h2:                       StyledComponentType<StyledElementType<'h2'>>,
    h3:                       StyledComponentType<StyledElementType<'h3'>>,
    h4:                       StyledComponentType<StyledElementType<'h4'>>,
    h5:                       StyledComponentType<StyledElementType<'h5'>>,
    h6:                       StyledComponentType<StyledElementType<'h6'>>,
    head:                     StyledComponentType<StyledElementType<'head'>>,
    header:                   StyledComponentType<StyledElementType<'header'>>,
    hgroup:                   StyledComponentType<StyledElementType<'hgroup'>>,
    hr:                       StyledComponentType<StyledElementType<'hr'>>,
    html:                     StyledComponentType<StyledElementType<'html'>>,
    i:                        StyledComponentType<StyledElementType<'i'>>,
    iframe:                   StyledComponentType<StyledElementType<'iframe'>>,
    img:                      StyledComponentType<StyledElementType<'img'>>,
    input:                    StyledComponentType<StyledElementType<'input'>>,
    ins:                      StyledComponentType<StyledElementType<'ins'>>,
    kbd:                      StyledComponentType<StyledElementType<'kbd'>>,
    keygen:                   StyledComponentType<StyledElementType<'keygen'>>,
    label:                    StyledComponentType<StyledElementType<'label'>>,
    legend:                   StyledComponentType<StyledElementType<'legend'>>,
    li:                       StyledComponentType<StyledElementType<'li'>>,
    link:                     StyledComponentType<StyledElementType<'link'>>,
    main:                     StyledComponentType<StyledElementType<'main'>>,
    map:                      StyledComponentType<StyledElementType<'map'>>,
    mark:                     StyledComponentType<StyledElementType<'mark'>>,
    menu:                     StyledComponentType<StyledElementType<'menu'>>,
    menuitem:                 StyledComponentType<StyledElementType<'menuitem'>>,
    meta:                     StyledComponentType<StyledElementType<'meta'>>,
    meter:                    StyledComponentType<StyledElementType<'meter'>>,
    nav:                      StyledComponentType<StyledElementType<'nav'>>,
    noscript:                 StyledComponentType<StyledElementType<'noscript'>>,
    object:                   StyledComponentType<StyledElementType<'object'>>,
    ol:                       StyledComponentType<StyledElementType<'ol'>>,
    optgroup:                 StyledComponentType<StyledElementType<'optgroup'>>,
    option:                   StyledComponentType<StyledElementType<'option'>>,
    output:                   StyledComponentType<StyledElementType<'output'>>,
    p:                        StyledComponentType<StyledElementType<'p'>>,
    param:                    StyledComponentType<StyledElementType<'param'>>,
    picture:                  StyledComponentType<StyledElementType<'picture'>>,
    pre:                      StyledComponentType<StyledElementType<'pre'>>,
    progress:                 StyledComponentType<StyledElementType<'progress'>>,
    q:                        StyledComponentType<StyledElementType<'q'>>,
    rp:                       StyledComponentType<StyledElementType<'rp'>>,
    rt:                       StyledComponentType<StyledElementType<'rt'>>,
    ruby:                     StyledComponentType<StyledElementType<'ruby'>>,
    s:                        StyledComponentType<StyledElementType<'s'>>,
    samp:                     StyledComponentType<StyledElementType<'samp'>>,
    script:                   StyledComponentType<StyledElementType<'script'>>,
    section:                  StyledComponentType<StyledElementType<'section'>>,
    select:                   StyledComponentType<StyledElementType<'select'>>,
    small:                    StyledComponentType<StyledElementType<'small'>>,
    source:                   StyledComponentType<StyledElementType<'source'>>,
    span:                     StyledComponentType<StyledElementType<'span'>>,
    strong:                   StyledComponentType<StyledElementType<'strong'>>,
    style:                    StyledComponentType<StyledElementType<'style'>>,
    sub:                      StyledComponentType<StyledElementType<'sub'>>,
    summary:                  StyledComponentType<StyledElementType<'summary'>>,
    sup:                      StyledComponentType<StyledElementType<'sup'>>,
    table:                    StyledComponentType<StyledElementType<'table'>>,
    tbody:                    StyledComponentType<StyledElementType<'tbody'>>,
    td:                       StyledComponentType<StyledElementType<'td'>>,
    textarea:                 StyledComponentType<StyledElementType<'textarea'>>,
    tfoot:                    StyledComponentType<StyledElementType<'tfoot'>>,
    th:                       StyledComponentType<StyledElementType<'th'>>,
    thead:                    StyledComponentType<StyledElementType<'thead'>>,
    time:                     StyledComponentType<StyledElementType<'time'>>,
    title:                    StyledComponentType<StyledElementType<'title'>>,
    tr:                       StyledComponentType<StyledElementType<'tr'>>,
    track:                    StyledComponentType<StyledElementType<'track'>>,
    u:                        StyledComponentType<StyledElementType<'u'>>,
    ul:                       StyledComponentType<StyledElementType<'ul'>>,
    var:                      StyledComponentType<StyledElementType<'var'>>,
    video:                    StyledComponentType<StyledElementType<'video'>>,
    wbr:                      StyledComponentType<StyledElementType<'wbr'>>,

    // SVG
    circle:                   StyledComponentType<StyledElementType<'circle'>>,
    clipPath:                 StyledComponentType<StyledElementType<'clipPath'>>,
    defs:                     StyledComponentType<StyledElementType<'defs'>>,
    ellipse:                  StyledComponentType<StyledElementType<'ellipse'>>,
    g:                        StyledComponentType<StyledElementType<'g'>>,
    image:                    StyledComponentType<StyledElementType<'image'>>,
    line:                     StyledComponentType<StyledElementType<'line'>>,
    linearGradient:           StyledComponentType<StyledElementType<'linearGradient'>>,
    mask:                     StyledComponentType<StyledElementType<'mask'>>,
    path:                     StyledComponentType<StyledElementType<'path'>>,
    pattern:                  StyledComponentType<StyledElementType<'pattern'>>,
    polygon:                  StyledComponentType<StyledElementType<'polygon'>>,
    polyline:                 StyledComponentType<StyledElementType<'polyline'>>,
    radialGradient:           StyledComponentType<StyledElementType<'radialGradient'>>,
    rect:                     StyledComponentType<StyledElementType<'rect'>>,
    stop:                     StyledComponentType<StyledElementType<'stop'>>,
    svg:                      StyledComponentType<StyledElementType<'svg'>>,
    text:                     StyledComponentType<StyledElementType<'text'>>,
    tspan:                    StyledComponentType<StyledElementType<'tspan'>>
  }

  declare export default StyledComponentList & {
    [[call]]: <S : string>(S) => $ElementType<StyledComponentList, S>,
    [[call]]: <P : {}, C : React$ComponentType<P>>(C) => StyledComponentType<C>
  };
}



declare module 'styled-components/native' {

  declare export type Interpolation =
                                    | (<P: {}>(executionContext: P) => string)
                                    | CSSRules
                                    | KeyFrames
                                    | string
                                    | number


  declare export type CSSRules = Interpolation[]

  // This is not exported on purpose, since it's an implementation detail
  declare type TaggedTemplateLiteral<R> = (strings : string[], ...interpolations : Interpolation[]) => R

  declare export type CSSConstructor = TaggedTemplateLiteral<CSSRules>
  declare export type KeyFramesConstructor = TaggedTemplateLiteral<KeyFrames>
  declare export type CreateGlobalStyleConstructor = TaggedTemplateLiteral<React$ComponentType<*>>

  declare interface Tag<T> {
    styleTag: HTMLStyleElement | null;
    getIds(): string[];
    hasNameForId(id: string, name: string): boolean;
    insertMarker(id: string): T;
    insertRules(id: string, cssRules: string[], name: ?string): void;
    removeRules(id: string): void;
    css(): string;
    toHTML(additionalAttrs: ?string): string;
    toElement(): React$Element<*>;
    clone(): Tag<T>;
    sealed: boolean;
  }

  // The `any`/weak types in here all come from `styled-components` directly, since those definitions were just copied over
  declare export class StyleSheet {
    static get master() : StyleSheet;
    static get instance() : StyleSheet;
    static reset(forceServer? : boolean) : void;

    id : number;
    forceServer : boolean;
    target : ?HTMLElement;
    tagMap : {[string]: Tag<any>}; // eslint-disable-line flowtype/no-weak-types
    deferred: { [string]: string[] | void };
    rehydratedNames: { [string]: boolean };
    ignoreRehydratedNames: { [string]: boolean };
    tags: Tag<any>[]; // eslint-disable-line flowtype/no-weak-types
    importRuleTag: Tag<any>; // eslint-disable-line flowtype/no-weak-types
    capacity: number;
    clones: StyleSheet[];

    constructor(?HTMLElement) : this;
    rehydrate() : this;
    clone() : StyleSheet;
    sealAllTags() : void;
    makeTag(tag : ?Tag<any>) : Tag<any>; // eslint-disable-line flowtype/no-weak-types
    getImportRuleTag() : Tag<any>; // eslint-disable-line flowtype/no-weak-types
    getTagForId(id : string): Tag<any>; // eslint-disable-line flowtype/no-weak-types
    hasId(id: string) : boolean;
    hasNameForId(id: string, name: string) : boolean;
    deferredInject(id : string, cssRules : string[]) : void;
    inject(id: string, cssRules : string[], name? : string) : void;
    remove(id : string) : void;
    toHtml() : string;
    toReactElements() : React$ElementType[];
  }

  declare export class KeyFrames {
    id : string;
    name : string;
    rules : string[];

    constructor(name : string, rules : string[]) : this;
    inject(StyleSheet) : void;
    toString() : string;
    getName() : string;
  }

  // I think any is appropriate here?
  // eslint-disable-next-line flowtype/no-weak-types
  declare export type Theme = {+[string] : any}

  declare export var css : CSSConstructor;
  declare export var keyframes : KeyFramesConstructor;
  declare export var createGlobalStyle : CreateGlobalStyleConstructor
  declare export var ThemeProvider : React$ComponentType<{children?: ?React$Node, theme : Theme | (Theme) => Theme}>

  // This is a bit hard to read. Not sure how to make it more readable. I think adding line-breaks makes it worse.
  declare type InjectedProps = { theme : Theme | void }
  declare  export function withTheme<Props : {}, Component: React$ComponentType<Props>>(WrappedComponent: Component) : React$ComponentType<$Diff<React$ElementConfig<$Supertype<Component>>, InjectedProps>>;


  // @HACK This is a cheat to hide that the underlying type is "just a string"
  //       once we know of a better way, we should be able to update this accordingly.
  //       I don't think there _is_ a good way, currently.
  // @NOTE Also not too sure about the naming of this...
  declare export type StyledElementType<T> = T;
  declare export type StyledComponentType<C> = {
    [[call]]: TaggedTemplateLiteral<C>,
    +attrs: <A: {}>(attributes: A) => TaggedTemplateLiteral<React$ComponentType<$Diff<React$ElementConfig<C>, A>>>
  };

  declare type StyledComponentList = {
    ActivityIndicator:             StyledComponentType<React$ComponentType<{}>>,
    ActivityIndicatorIOS:          StyledComponentType<React$ComponentType<{}>>,
    ART:                           StyledComponentType<React$ComponentType<{}>>,
    Button:                        StyledComponentType<React$ComponentType<{}>>,
    DatePickerIOS:                 StyledComponentType<React$ComponentType<{}>>,
    DrawerLayoutAndroid:           StyledComponentType<React$ComponentType<{}>>,
    Image:                         StyledComponentType<React$ComponentType<{}>>,
    ImageBackground:               StyledComponentType<React$ComponentType<{}>>,
    ImageEditor:                   StyledComponentType<React$ComponentType<{}>>,
    ImageStore:                    StyledComponentType<React$ComponentType<{}>>,
    KeyboardAvoidingView:          StyledComponentType<React$ComponentType<{}>>,
    ListView:                      StyledComponentType<React$ComponentType<{}>>,
    MapView:                       StyledComponentType<React$ComponentType<{}>>,
    Modal:                         StyledComponentType<React$ComponentType<{}>>,
    NavigatorIOS:                  StyledComponentType<React$ComponentType<{}>>,
    Picker:                        StyledComponentType<React$ComponentType<{}>>,
    PickerIOS:                     StyledComponentType<React$ComponentType<{}>>,
    ProgressBarAndroid:            StyledComponentType<React$ComponentType<{}>>,
    ProgressViewIOS:               StyledComponentType<React$ComponentType<{}>>,
    ScrollView:                    StyledComponentType<React$ComponentType<{}>>,
    SegmentedControlIOS:           StyledComponentType<React$ComponentType<{}>>,
    Slider:                        StyledComponentType<React$ComponentType<{}>>,
    SliderIOS:                     StyledComponentType<React$ComponentType<{}>>,
    SnapshotViewIOS:               StyledComponentType<React$ComponentType<{}>>,
    Switch:                        StyledComponentType<React$ComponentType<{}>>,
    RecyclerViewBackedScrollView:  StyledComponentType<React$ComponentType<{}>>,
    RefreshControl:                StyledComponentType<React$ComponentType<{}>>,
    SafeAreaView:                  StyledComponentType<React$ComponentType<{}>>,
    StatusBar:                     StyledComponentType<React$ComponentType<{}>>,
    SwipeableListView:             StyledComponentType<React$ComponentType<{}>>,
    SwitchAndroid:                 StyledComponentType<React$ComponentType<{}>>,
    SwitchIOS:                     StyledComponentType<React$ComponentType<{}>>,
    TabBarIOS:                     StyledComponentType<React$ComponentType<{}>>,
    Text:                          StyledComponentType<React$ComponentType<{}>>,
    TextInput:                     StyledComponentType<React$ComponentType<{}>>,
    ToastAndroid:                  StyledComponentType<React$ComponentType<{}>>,
    ToolbarAndroid:                StyledComponentType<React$ComponentType<{}>>,
    Touchable:                     StyledComponentType<React$ComponentType<{}>>,
    TouchableHighlight:            StyledComponentType<React$ComponentType<{}>>,
    TouchableNativeFeedback:       StyledComponentType<React$ComponentType<{}>>,
    TouchableOpacity:              StyledComponentType<React$ComponentType<{}>>,
    TouchableWithoutFeedback:      StyledComponentType<React$ComponentType<{}>>,
    View:                          StyledComponentType<React$ComponentType<{}>>,
    ViewPagerAndroid:              StyledComponentType<React$ComponentType<{}>>,
    WebView:                       StyledComponentType<React$ComponentType<{}>>,
    FlatList:                      StyledComponentType<React$ComponentType<{}>>,
    SectionList:                   StyledComponentType<React$ComponentType<{}>>,
    VirtualizedList:               StyledComponentType<React$ComponentType<{}>>,
  }

  declare export default StyledComponentList & {
    [[call]]: <S : string>(S) => $ElementType<StyledComponentList, S>,
    [[call]]: <P : {}, C : React$ComponentType<P>>(C) => StyledComponentType<C>
  };
}
