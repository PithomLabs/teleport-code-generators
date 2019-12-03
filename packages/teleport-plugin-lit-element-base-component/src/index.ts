import * as types from '@babel/types'
import { UIDLUtils } from '@teleporthq/teleport-shared'
import { createLitHTMLTemplateSyntax, ASTBuilders } from '@teleporthq/teleport-plugin-common'
import {
  ComponentPluginFactory,
  ComponentPlugin,
  ChunkType,
  FileType,
} from '@teleporthq/teleport-types'
import { createClassDeclaration, createHTMLPrefixTag, createTemplateElement } from './utils'

import {
  DEFAULT_COMPONENT_CHUNK_NAME,
  DEFAULT_COMPONENT_DECORATOR_CHUNK_NAME,
  DEFAULT_IMPORT_CHUNK_NAME,
  LIT_HTML_CORE_DEPENDENCY,
} from './constants'

interface LitElementPluginConfig {
  componentChunkName: string
  componentDecoratorChunkName: string
  importChunkName: string
}

export const createLitElementComponentPlugin: ComponentPluginFactory<LitElementPluginConfig> = (
  config
) => {
  const {
    componentChunkName = DEFAULT_COMPONENT_CHUNK_NAME,
    componentDecoratorChunkName = DEFAULT_COMPONENT_DECORATOR_CHUNK_NAME,
    importChunkName = DEFAULT_IMPORT_CHUNK_NAME,
  } = config || {}

  const litElementComponentPlugin: ComponentPlugin = async (structure) => {
    const { uidl, dependencies } = structure
    const { stateDefinitions = {}, propDefinitions = {} } = uidl

    dependencies.LitElement = LIT_HTML_CORE_DEPENDENCY
    dependencies.html = LIT_HTML_CORE_DEPENDENCY
    dependencies.property = LIT_HTML_CORE_DEPENDENCY
    dependencies.customElement = LIT_HTML_CORE_DEPENDENCY

    // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
    // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
    // The structure will be populated as the AST is being created
    const nodesLookup = {}
    const litHTMLParams = {
      propDefinitions,
      stateDefinitions,
      nodesLookup,
      dependencies,
    }
    const htmlSyntax = createLitHTMLTemplateSyntax(uidl.node, litHTMLParams)
    const templateElement: types.TemplateElement = createTemplateElement(htmlSyntax)
    const templateExpression: types.TaggedTemplateExpression = createHTMLPrefixTag(templateElement)

    const componentName = UIDLUtils.getComponentClassName(uidl)
    const exportAST = createClassDeclaration(
      componentName,
      propDefinitions,
      stateDefinitions,
      templateExpression
    )

    const decoratorAST = ASTBuilders.createCustomElementDecorator(
      UIDLUtils.createWebComponentFriendlyName(componentName)
    )

    structure.chunks.push({
      type: ChunkType.AST,
      fileType: FileType.TS,
      name: componentDecoratorChunkName,
      meta: {
        nodesLookup,
      },
      content: decoratorAST,
      linkAfter: [importChunkName],
    })

    structure.chunks.push({
      type: ChunkType.AST,
      fileType: FileType.TS,
      name: componentChunkName,
      meta: {
        nodesLookup,
      },
      content: exportAST,
      linkAfter: [importChunkName],
    })

    return structure
  }

  return litElementComponentPlugin
}

export default createLitElementComponentPlugin()
