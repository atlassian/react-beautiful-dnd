<p align="center">
  <img src="https://user-images.githubusercontent.com/2182637/53611918-54c1ff80-3c24-11e9-9917-66ac3cef513d.png" alt="logo do react beautiful dnd" />
</p>
<h1 align="center">react-beautiful-dnd</h1>

<div align="center">

Clique e arraste **Lindo** e **acessível** para listas com [`React`](https://facebook.github.io/react/)

[![CircleCI branch](https://img.shields.io/circleci/project/github/atlassian/react-beautiful-dnd/master.svg)](https://circleci.com/gh/atlassian/react-beautiful-dnd/tree/master)
[![npm](https://img.shields.io/npm/v/react-beautiful-dnd.svg)](https://www.npmjs.com/package/react-beautiful-dnd)

![exemplo de aplicação](https://user-images.githubusercontent.com/2182637/53614150-efbed780-3c2c-11e9-9204-a5d2e746faca.gif)

[Brinque com este exemplo se você quiser!](https://react-beautiful-dnd.netlify.com/iframe.html?selectedKind=board&selectedStory=simple)

</div>

## Principais características

- [Movimento natural](/docs/about/animations.md) e lindo dos itens 💐
- [Accessível](/docs/about/accessibility.md): suporte poderoso ao teclado e leitores de tela ♿️
- [Extremamente performático](/docs/support/media.md) 🚀
- API limpa e poderosa, fácil de começar a usar
- Brinca muito bem com as interações padrões do browser
- [Estilo sem influência](/docs/guides/preset-styles.md)
- Sem a criação de Nós DOM adicionais ao redor - amigável para flexbox e gerenciamento de foco!

## Comece a usar 👩‍🏫

Nós criamos um [curso grátis no `egghead.io`🥚](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd) para te ajudar a começar a usar o `react-beautiful-dnd` o mais rápido possível.

[![course-logo](https://user-images.githubusercontent.com/2182637/43372837-8c72d3f8-93e8-11e8-9d92-a82adde7718f.png)](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)

## Pacote atual de funcionalidades suportadas ✅

- Listas verticais ↕
- Listas horizontais ↔
- Movimento entre listas (▤ ↔ ▤)
- [Combinar items](/docs/guides/combining.md)
- Suporte a Mouse 🐭, teclado 🎹♿️ e toque 👉📱(celulares, tablets e por aí vai)
- [Suporte a arraste múltiplo](/docs/patterns/multi-drag.md)
- Suporte incrível a leitores de tela ♿️ - Nós fornecemos de fábrica uma experiência incrível para leitores de tela em inglês📦. Nós também fornecemos personalização completa e suporte a internacionalização para aqueles que precisam deles 💖
- [Arraste condicional](/docs/api/draggable.md#optional-props) e [solte condicional](/docs/api/droppable.md#conditionally-dropping)
- Listas múltiplas e independentes em uma mesma página
- Itens de tamanhos flexíveis - os items arrastáveis podem ter alturas diferentes (listas verticais) ou larguras (listas horizontais)
- [Adição/Remoção de itens durante o arraste](/docs/guides/changes-while-dragging.md)
- Compatível com a reordenação semântica de `<table>` - [padrão de tabela](/docs/patterns/tables.md)
- [Rolagem Automática](/docs/guides/auto-scrolling.md) - automaticamente rola os elementos e a janela de acordo com a necessidade durante o arraste (mesmo com o teclado 🔥)
- Alças de arraste personalizadas - Você pode arrastar pelo item inteiro, ou só por parte dele
- Compatível com [`ReactDOM.createPortal`](https://reactjs.org/docs/portals.html) - [padrão de portais](/docs/patterns/using-a-portal.md)
- 🌲 Suporte ao pacote de árvores [`@atlaskit/tree`](https://atlaskit.atlassian.com/packages/core/tree)
- Uma lista `<Droppable />` pode ser um container rolável (sem um pai rolável) ou ser filho de um container rolável (que também não tenha um pai rolável)
- Listas aninhadas independentes - uma lista pode ser filha de outra lista, mas você não pode arrastar da lista pai pra lista filha
- Compatível com renderização no servidor (SSR) - veja [resetServerContext()](/docs/api/reset-server-context.md)
- Brinca bem com [elementos interativos aninhados](/docs/api/draggable.md#interactive-child-elements-within-a-draggable-) by default

## Motivação 🤔

O `react-beautiful-dnd` existe para criar lindas listas de clique e arraste que qualquer um possa usar - até mesmo pessoas que não podem enxergar. Para um bom panorama da história e motivações para o projeto, você pode dar uma olhada nos seguintes recursos externos:

- 📖 [Repensando o Clique e Arraste](https://medium.com/@alexandereardon/rethinking-drag-and-drop-d9f5770b4e6b)
- 🎧 [React podcast: Clique e arraste rápido, bonito e accessível](https://reactpodcast.simplecast.fm/17)

## Não é para todos ✌️

Existem muitas bibliotecas por aí que permitem clique e arraste dentro do React. A mais notável delas é a maravilhosa[`react-dnd`](https://github.com/react-dnd/react-dnd). Ela faz um trabalho incrível em fornecer um conjunto de elementos primitivos de clique e arraste que funcionam especialmente bem com a [selvagenmente inconsistente](https://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html) funcionalidade de clique e arraste do html5. `react-beautiful-dnd` é uma abstração de alto nível construída especificamente para listas(vertical, horizontal, movimento entre listas, listas aninhadas, etc). Dentro desse conjunto de funcionalidades, o `react-beautiful-dnd` oferece uma poderosa, natural e linda experiência de clique e arraste. No entanto, ele não provê a gama de funcionalidades oferecida pelo `react-dnd`. Então o `react-beautiful-dnd` pode não ser para você, dependendo do seu caso. 

## Documentação 📖

### About 👋

- [Instalação](/docs/about/installation.md)
- [Exemplos e amostras](/docs/about/examples.md)
- [Comece a usar](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)
- [Princípios de design](/docs/about/design-principles.md)
- [Animações](/docs/about/animations.md)
- [Accessibilidade](/docs/about/accessibility.md)
- [Suporte de Navegador](/docs/about/browser-support.md)

### Sensores 🔉

> Os jeitos que alguém controla um clique e arraste

- [Arrastando com o mouse 🐭](/docs/sensors/mouse.md)
- [Arrastando com o toque 👉📱](/docs/sensors/touch.md)
- [Arrastando com o teclado 🎹♿️](/docs/sensors/keyboard.md)

### API 🏋️‍

![diagrama](https://user-images.githubusercontent.com/2182637/53607406-c8f3a780-3c12-11e9-979c-7f3b5bd1bfbd.gif)

- [`<DragDropContext />`](/docs/api/drag-drop-context.md) - _Encapsula os elementos para os quais você quer ter clique e arraste_
- [`<Droppable />`](/docs/api/droppable.md) - _Uma área onde elementos podem ser soltos. Contém `<Draggable />`s_
- [`<Draggable />`](/docs/api/draggable.md) - _O que pode ser arrastado por aí_
- [`resetServerContext()`](/docs/api/reset-server-context.md) - _Utilidade para Renderização no Servidor(SSR)_

### Guias 🗺

- [`<DragDropContext />` respondedores](/docs/guides/responders.md) - _`onDragStart`, `onDragUpdate`, `onDragEnd` and `onBeforeDragStart`_
- [Combinando `<Draggable />`s](/docs/guides/combining.md)
- [Problemas comuns na configuração](/docs/guides/common-setup-issues.md)
- [Usando `innerRef`](/docs/guides/using-inner-ref.md)
- [Alertas de desenvolvedor e como desabilitá-los](/docs/guides/developer-warnings.md)
- [Regras para `draggableId` e `droppableId`s](/docs/guides/identifiers.md)
- [Customizando e pulando a animação de soltar](/docs/guides/drop-animation.md)
- [Rolagem automática](/docs/guides/auto-scrolling.md)
- [Controlando o leitor de tela](/docs/guides/screen-reader.md)
- [Usando o `doctype` html5](/docs/guides/doctype.md)
- [`TypeScript` e `flow`](/docs/guides/types.md)
- [Arrastando `<svg>`s](/docs/guides/dragging-svgs.md)
- [Estilos pre-setados invisíveis](/docs/guides/preset-styles.md)
- [Como detectamos os contâineres roláveis](/docs/guides/how-we-detect-scroll-containers.md)
- [Como usamos eventos DOM](/docs/guides/how-we-use-dom-events.md) - _Useful if you need to build on top of `react-beautiful-dnd`_
- [Adicionando um `<Draggable />`s durante o arraste](/docs/guides/changes-while-dragging.md) - _⚠️ Advanced_

### Padrões 👷‍

- [Arraste Múltiplo](/docs/patterns/multi-drag.md)
- [Tabelas](/docs/patterns/tables.md)
- [Usando um portal (`ReactDOM.createPortal`)](/docs/patterns/using-a-portal.md)

### Suporte 👩‍⚕️

- [Saúde da engenharia](/docs/support/engineering-health.md)
- [Comunidade e adicionais](/docs/support/community-and-addons.md)
- [Notas de lançamento e mudanças](https://github.com/atlassian/react-beautiful-dnd/releases)
- [Atualizando](/docs/support/upgrading.md)
- [Caminho de desenvolvimento](https://github.com/atlassian/react-beautiful-dnd/issues)
- [Mídia](/docs/support/media.md)

## Leia isso em outros idiomas 🌎

- [![kr](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/South-Korea.png) **한글/Korean**](https://github.com/LeeHyungGeun/react-beautiful-dnd-kr)
- [![china](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/China.png) **中文/Chinese**](https://github.com/chinanf-boy/react-beautiful-dnd-zh)
- [![ru](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/Russia.png) На русском/Russian**](https://github.com/vtereshyn/react-beautiful-dnd-ru)
- [![pt](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/Brazil.png) Português/Portuguese**](https://github.com/dudestein/react-beautiful-dnd-pt)

## Autor ✍️

Alex Reardon [@alexandereardon](https://twitter.com/alexandereardon)

## Colaboradores 🤝

- Bogdan Chadkin [@IAmTrySound](https://twitter.com/IAmTrySound)
- Luke Batchelor [@alukebatchelor](https://twitter.com/alukebatchelor)
- Jared Crowe [@jaredjcrowe](https://twitter.com/jaredjcrowe)
- Many other [@Atlassian](https://twitter.com/Atlassian)'s!
