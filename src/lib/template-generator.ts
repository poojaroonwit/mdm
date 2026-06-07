import {
  buildDashboardTemplate,
  buildDefaultTemplates,
  buildEntityTableTemplate,
  buildFormTemplate
} from './template-generator-builders'
import type { DataModel, Template } from './template-generator-types'

export type { DataModel, Template, TemplatePage } from './template-generator-types'

export class TemplateGenerator {
  static generateEntityTableTemplate(dataModel: DataModel): Template {
    return buildEntityTableTemplate(dataModel)
  }

  static generateDashboardTemplate(dataModel: DataModel): Template {
    return buildDashboardTemplate(dataModel)
  }

  static generateFormTemplate(dataModel: DataModel): Template {
    return buildFormTemplate(dataModel)
  }

  static generateDefaultTemplates(dataModel: DataModel): Template[] {
    return buildDefaultTemplates(dataModel)
  }
}
