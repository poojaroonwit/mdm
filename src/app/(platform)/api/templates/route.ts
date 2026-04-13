import { NextRequest, NextResponse } from 'next/server'
import { Template } from '@/lib/template-generator'
import { getStoredTemplates, saveStoredTemplates, updateStoredTemplate, deleteStoredTemplate } from '@/lib/server-template-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataModelId = searchParams.get('dataModelId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let templates = await getStoredTemplates()

    // Filter by dataModelId
    if (dataModelId) {
      templates = templates.filter(t => t.dataModelId === dataModelId)
    }

    // Search
    if (search) {
      const lowerSearch = search.toLowerCase()
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(lowerSearch) ||
        template.displayName.toLowerCase().includes(lowerSearch) ||
        (template.description && template.description.toLowerCase().includes(lowerSearch)) ||
        template.category.toLowerCase().includes(lowerSearch)
      )
    }

    // Filter by category
    if (category) {
      templates = templates.filter(template => template.category === category)
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const template: Template = await request.json()

    // Validate template structure
    if (!template.id || !template.name || !template.displayName) {
      return NextResponse.json(
        { success: false, error: 'Invalid template structure' },
        { status: 400 }
      )
    }

    const templates = await getStoredTemplates()
    const existingIndex = templates.findIndex(t => t.id === template.id)

    if (existingIndex >= 0) {
      // Update existing
      templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() }
    } else {
      // Create new
      templates.push({
        ...template,
        createdAt: template.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    await saveStoredTemplates(templates)

    return NextResponse.json({
      success: true,
      template,
      message: 'Template saved successfully'
    })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    let templates = await getStoredTemplates()
    const initialLength = templates.length
    templates = templates.filter(t => t.id !== templateId)

    if (templates.length !== initialLength) {
      await saveStoredTemplates(templates)
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
