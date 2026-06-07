'use client'
import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Trash2, 
  Eye, 
  Download,
  BarChart3,
  Table,
  FileText,
  Image
} from 'lucide-react'
interface ReportSection {
  id: string
  type: 'chart' | 'table' | 'text' | 'image'
  title: string
  config: any
  dataSource: string
  filters: FilterConfig[]
  position: number
}
interface FilterConfig {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between'
  value: any
}
interface ReportBuilderProps {
  reportId?: string
  spaceId: string
  onSave: (report: any) => void
  onPreview: (report: any) => void
}

export function ReportBuilder({ 
  reportId, 
  spaceId, 
  onSave, 
  onPreview 
}: ReportBuilderProps) {
  const [sections, setSections] = useState<ReportSection[]>([])
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [reportConfig, setReportConfig] = useState({
    title: '',
    description: '',
    format: 'pdf',
    orientation: 'portrait',
    header: true,
    footer: true
  })

  const addSection = useCallback((type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      type,
      title: `New ${type}`,
      config: getDefaultConfig(type),
      dataSource: '',
      filters: [],
      position: sections.length
    }
    setSections([...sections, newSection])
    setSelectedSection(newSection.id)
  }, [sections])

  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s))
  }, [sections])

  const deleteSection = useCallback((sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }
  }, [sections, selectedSection])

  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const newSections = [...sections]
    const [movedSection] = newSections.splice(index, 1)
    newSections.splice(newIndex, 0, movedSection)
    
    // Update positions
    newSections.forEach((section, idx) => {
      section.position = idx
    })
    
    setSections(newSections)
  }, [sections])

  const getDefaultConfig = (type: ReportSection['type']) => {
    switch (type) {
      case 'chart':
        return { 
          chartType: 'bar', 
          showLegend: true, 
          showGrid: true,
          colors: ['#8884d8', '#82ca9d', '#ffc658']
        }
      case 'table':
        return { 
          columns: [], 
          showHeader: true, 
          showBorders: true,
          alternatingRows: true
        }
      case 'text':
        return { 
          content: 'Enter text here', 
          fontSize: 12, 
          alignment: 'left',
          bold: false,
          italic: false
        }
      case 'image':
        return { 
          src: '', 
          alt: '', 
          width: 200, 
          height: 150,
          alignment: 'center'
        }
      default:
        return {}
    }
  }

  const getSectionIcon = (type: ReportSection['type']) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="h-4 w-4" />
      case 'table':
        return <Table className="h-4 w-4" />
      case 'text':
        return <FileText className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const renderSection = (section: ReportSection) => {
    const isSelected = selectedSection === section.id

    return (
      <Card
        key={section.id}
        className={`cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedSection(section.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              {getSectionIcon(section.type)}
              {section.title}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  moveSection(section.id, 'up')
                }}
                disabled={sections.findIndex(s => s.id === section.id) === 0}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  moveSection(section.id, 'down')
                }}
                disabled={sections.findIndex(s => s.id === section.id) === sections.length - 1}
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSection(section.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {renderSectionContent(section)}
        </CardContent>
      </Card>
    )
  }

  const renderSectionContent = (section: ReportSection) => {
    switch (section.type) {
      case 'chart':
        return <ChartSection section={section} onUpdate={updateSection} />
      case 'table':
        return <TableSection section={section} onUpdate={updateSection} />
      case 'text':
        return <TextSection section={section} onUpdate={updateSection} />
      case 'image':
        return <ImageSection section={section} onUpdate={updateSection} />
      default:
        return <div className="text-muted-foreground">Unknown section type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportConfig.title}
                onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                placeholder="Monthly Sales Report"
              />
            </div>
            <div>
              <Label htmlFor="report-format">Format</Label>
              <Select value={reportConfig.format} onValueChange={(value) => setReportConfig({ ...reportConfig, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="report-description">Description</Label>
            <Input
              id="report-description"
              value={reportConfig.description}
              onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
              placeholder="Report description"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Report Sections</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => addSection('chart')}>
                <BarChart3 className="h-4 w-4 mr-1" />
                Chart
              </Button>
              <Button size="sm" variant="outline" onClick={() => addSection('table')}>
                <Table className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button size="sm" variant="outline" onClick={() => addSection('text')}>
                <FileText className="h-4 w-4 mr-1" />
                Text
              </Button>
              <Button size="sm" variant="outline" onClick={() => addSection('image')}>
                <Image className="h-4 w-4 mr-1" />
                Image
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map(renderSection)}
            {sections.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sections Added</h3>
                <p className="text-muted-foreground mb-4">
                  Add sections to build your report
                </p>
                <Button onClick={() => addSection('text')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Section
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Section Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSection ? (
                <SectionProperties
                  section={sections.find(s => s.id === selectedSection)!}
                  onUpdate={updateSection}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a section to edit properties
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {sections.length} sections • {reportConfig.format.toUpperCase()} format
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onPreview({ sections, config: reportConfig })}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => onSave({ sections, config: reportConfig })}>
            <Download className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>
    </div>
  )
}

// Section Components
function ChartSection({ section, onUpdate }: { section: ReportSection, onUpdate: (id: string, updates: Partial<ReportSection>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Chart Type</Label>
        <Select value={section.config.chartType} onValueChange={(value) => onUpdate(section.id, { config: { ...section.config, chartType: value } })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
            <SelectItem value="area">Area Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Data Source</Label>
        <Select value={section.dataSource} onValueChange={(value) => onUpdate(section.id, { dataSource: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="data-models">Data Models</SelectItem>
            <SelectItem value="records">Records</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function TableSection({ section, onUpdate }: { section: ReportSection, onUpdate: (id: string, updates: Partial<ReportSection>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Table Columns</Label>
        <div className="text-sm text-muted-foreground">
          Configure table columns and data source
        </div>
      </div>
      <div>
        <Label>Data Source</Label>
        <Select value={section.dataSource} onValueChange={(value) => onUpdate(section.id, { dataSource: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="data-models">Data Models</SelectItem>
            <SelectItem value="records">Records</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function TextSection({ section, onUpdate }: { section: ReportSection, onUpdate: (id: string, updates: Partial<ReportSection>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Text Content</Label>
        <Input
          value={section.config.content}
          onChange={(e) => onUpdate(section.id, { config: { ...section.config, content: e.target.value } })}
          placeholder="Enter text content"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Font Size</Label>
          <Input
            type="number"
            value={section.config.fontSize}
            onChange={(e) => onUpdate(section.id, { config: { ...section.config, fontSize: parseInt(e.target.value) } })}
          />
        </div>
        <div>
          <Label>Alignment</Label>
          <Select value={section.config.alignment} onValueChange={(value) => onUpdate(section.id, { config: { ...section.config, alignment: value } })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function ImageSection({ section, onUpdate }: { section: ReportSection, onUpdate: (id: string, updates: Partial<ReportSection>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Image URL</Label>
        <Input
          value={section.config.src}
          onChange={(e) => onUpdate(section.id, { config: { ...section.config, src: e.target.value } })}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Width</Label>
          <Input
            type="number"
            value={section.config.width}
            onChange={(e) => onUpdate(section.id, { config: { ...section.config, width: parseInt(e.target.value) } })}
          />
        </div>
        <div>
          <Label>Height</Label>
          <Input
            type="number"
            value={section.config.height}
            onChange={(e) => onUpdate(section.id, { config: { ...section.config, height: parseInt(e.target.value) } })}
          />
        </div>
      </div>
    </div>
  )
}

function SectionProperties({ section, onUpdate }: { section: ReportSection, onUpdate: (id: string, updates: Partial<ReportSection>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title</Label>
        <Input
          value={section.title}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          placeholder="Section title"
        />
      </div>
      <div>
        <Label>Data Source</Label>
        <Select value={section.dataSource} onValueChange={(value) => onUpdate(section.id, { dataSource: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="data-models">Data Models</SelectItem>
            <SelectItem value="records">Records</SelectItem>
            <SelectItem value="attachments">Attachments</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Filters</Label>
        <div className="text-sm text-muted-foreground">
          Configure data filters for this section
        </div>
      </div>
    </div>
  )
}
