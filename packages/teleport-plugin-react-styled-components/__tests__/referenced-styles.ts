import {
  ChunkDefinition,
  ChunkType,
  FileType,
  ComponentStructure,
} from '@teleporthq/teleport-types'
import { createReactStyledComponentsPlugin } from '../src'
import { component, elementNode, staticNode } from '@teleporthq/teleport-uidl-builders'

describe('Referenced Styles on Node', () => {
  const componentChunk: ChunkDefinition = {
    name: 'jsx-component',
    meta: {
      nodesLookup: {
        container: {
          openingElement: {
            name: {
              name: '',
            },
          },
        },
      },
      dynamicRefPrefix: {
        prop: 'props.',
      },
    },
    type: ChunkType.AST,
    fileType: FileType.JS,
    linkAfter: ['import-local'],
    content: {},
  }
  const uidl = component('MyComponent', elementNode('container', null, [], null, null, null, null))

  it('Media and pseudo styles are generated from referencedStyles', async () => {
    const plugin = createReactStyledComponentsPlugin()
    uidl.node.content.referencedStyles = {
      '5ed659b1732f9b804f7b6381': {
        id: '5ed659b1732f9b804f7b6381',
        type: 'style-map',
        content: {
          mapType: 'inlined',
          conditions: [{ conditionType: 'screen-size', maxWidth: 991 }],
          styles: {
            display: staticNode('none'),
          },
        },
      },
      '5ed659b1732f9b804f7b6382': {
        id: '5ed659b1732f9b804f7b6382',
        type: 'style-map',
        content: {
          mapType: 'inlined',
          conditions: [{ conditionType: 'element-state', content: 'hover' }],
          styles: {
            display: staticNode('block'),
          },
        },
      },
    }
    uidl.node.content.key = 'container'

    const structure: ComponentStructure = {
      uidl,
      chunks: [componentChunk],
      dependencies: {},
      options: {},
    }

    const result = await plugin(structure)
    const { chunks, dependencies } = result

    expect(chunks[1].name).toBe('Container')
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      'display: block'
    )
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      'display: none'
    )
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      '@media(max-width: 991px)'
    )
    expect(Object.keys(dependencies).length).toBe(1)
  })

  it('References a style from project and adds, Media and pseudo from referencedStyles', async () => {
    const plugin = createReactStyledComponentsPlugin()
    uidl.node.content.referencedStyles = {
      '5ed659b1732f9b804f7b6381': {
        id: '5ed659b1732f9b804f7b6381',
        type: 'style-map',
        content: {
          mapType: 'inlined',
          conditions: [{ conditionType: 'screen-size', maxWidth: 991 }],
          styles: {
            display: staticNode('none'),
          },
        },
      },
      '5ed659b1732f9b804f7b6382': {
        id: '5ed659b1732f9b804f7b6382',
        type: 'style-map',
        content: {
          mapType: 'inlined',
          conditions: [{ conditionType: 'element-state', content: 'hover' }],
          styles: {
            display: staticNode('block'),
          },
        },
      },
      '5ed659b1732f9b804f7b6384': {
        id: '5ed659b1732f9b804f7b6384',
        type: 'style-map',
        content: {
          mapType: 'project-referenced',
          referenceId: '5ecfa1233b8e50f60ea2b64d',
        },
      },
    }
    uidl.node.content.key = 'container'

    const structure: ComponentStructure = {
      uidl,
      chunks: [componentChunk],
      dependencies: {},
      options: {},
    }

    const styleSetDefinitions = {
      '5ecfa1233b8e50f60ea2b64d': {
        id: '5ecfa1233b8e50f60ea2b64d',
        name: 'primaryButton',
        type: 'reusable-project-style-map',
        content: {
          background: staticNode('blue'),
          color: staticNode('red'),
        },
      },
    }

    structure.options.projectStyleSet = {
      styleSetDefinitions,
      fileName: 'style',
      path: '..',
    }

    const result = await plugin(structure)
    const { chunks, dependencies } = result

    expect(chunks[1].name).toBe('Container')
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      'display: block'
    )
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      'display: none'
    )
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      '@media(max-width: 991px)'
    )
    expect(chunks[1].content.declarations[0].init.quasi.quasis[0].value.raw).toContain(
      '${PrimaryButton'
    )
    expect(Object.keys(dependencies).length).toBe(2)
  })
})
