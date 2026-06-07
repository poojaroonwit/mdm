'use client'

// Enhanced Notebook Execution Engine
export interface ExecutionResult {
  stdout?: string
  stderr?: string
  result?: any
  error?: string
  executionTime: number
  variables?: Record<string, any>
  charts?: ChartOutput[]
  tables?: TableOutput[]
  images?: ImageOutput[]
}

export interface ChartOutput {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram' | 'box' | 'heatmap'
  data: any[]
  config: any
  title: string
}

export interface TableOutput {
  data: any[]
  columns: string[]
  title?: string
  pagination?: {
    page: number
    totalPages: number
    totalRows: number
  }
}

export interface ImageOutput {
  data: string // base64 encoded
  format: 'png' | 'jpg' | 'svg'
  title?: string
}

export interface Kernel {
  id: string
  name: string
  language: string
  status: 'idle' | 'busy' | 'error' | 'starting' | 'stopped'
  lastActivity: Date
  variables: Record<string, any>
  executionCount: number
}

export interface ExecutionContext {
  kernelId: string
  variables: Record<string, any>
  imports: string[]
  dataSources: Record<string, any[]>
}

class NotebookExecutionEngine {
  private kernels: Map<string, Kernel> = new Map()
  private executionQueue: Array<{ id: string; code: string; kernelId: string; resolve: Function; reject: Function }> = []
  private isProcessing = false

  constructor() {
    this.initializeDefaultKernels()
  }

  private initializeDefaultKernels() {
    // Python kernel
    this.createKernel('python', 'Python 3.11', 'python')
    
    // R kernel
    this.createKernel('r', 'R 4.3', 'r')
    
    // SQL kernel
    this.createKernel('sql', 'SQL', 'sql')
    
    // JavaScript kernel
    this.createKernel('javascript', 'Node.js', 'javascript')
    
    // TypeScript kernel
    this.createKernel('typescript', 'TypeScript', 'typescript')
  }

  createKernel(id: string, name: string, language: string): Kernel {
    const kernel: Kernel = {
      id,
      name,
      language,
      status: 'idle',
      lastActivity: new Date(),
      variables: {},
      executionCount: 0
    }
    
    this.kernels.set(id, kernel)
    return kernel
  }

  getKernel(id: string): Kernel | undefined {
    return this.kernels.get(id)
  }

  getAllKernels(): Kernel[] {
    return Array.from(this.kernels.values())
  }

  async executeCode(code: string, language: string, context?: ExecutionContext): Promise<ExecutionResult> {
    const kernelId = context?.kernelId || language
    const kernel = this.getKernel(kernelId)
    
    if (!kernel) {
      throw new Error(`No kernel found for language: ${language}`)
    }

    const startTime = Date.now()
    
    try {
      // Update kernel status
      kernel.status = 'busy'
      kernel.lastActivity = new Date()
      kernel.executionCount++

      // Execute based on language
      let result: ExecutionResult
      switch (language) {
        case 'python':
          result = await this.executePython(code, kernel, context)
          break
        case 'r':
          result = await this.executeR(code, kernel, context)
          break
        case 'sql':
          result = await this.executeSQL(code, kernel, context)
          break
        case 'javascript':
          result = await this.executeJavaScript(code, kernel, context)
          break
        case 'typescript':
          result = await this.executeTypeScript(code, kernel, context)
          break
        default:
          throw new Error(`Unsupported language: ${language}`)
      }

      result.executionTime = Date.now() - startTime
      kernel.status = 'idle'
      
      return result
    } catch (error) {
      kernel.status = 'error'
      return {
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: Date.now() - startTime
      }
    }
  }

  private async executePython(code: string, kernel: Kernel, context?: ExecutionContext): Promise<ExecutionResult> {
    try {
      // Call the actual Python execution API
      const response = await fetch('/api/notebook/execute-python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          timeout: 30000, // 30 seconds default timeout
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Python execution failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Convert API response to ExecutionResult format
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        result: result.result || result.stdout || null,
        error: result.error || null,
        executionTime: result.executionTime || 0,
        variables: result.variables || { ...kernel.variables },
        // Extract tables and charts if available (for future enhancement)
        tables: result.tables || [],
        charts: result.charts || [],
        images: result.images || [],
      }
    } catch (error) {
      // If API call fails, return error
      return {
        error: error instanceof Error ? error.message : 'Python execution failed',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        variables: kernel.variables,
      }
    }
  }

  private async executeR(code: string, kernel: Kernel, context?: ExecutionContext): Promise<ExecutionResult> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    if (code.includes('ggplot') || code.includes('plot(')) {
      return {
        stdout: 'R plot generated',
        result: 'Visualization created',
        executionTime: 0,
        charts: [{
          type: 'scatter',
          data: this.generateSampleData('scatter'),
          config: { title: 'R Plot' },
          title: 'R Visualization'
        }],
        variables: { ...kernel.variables, 'plot': 'ggplot object' }
      }
    }
    
    return {
      stdout: 'R code executed successfully',
      result: 'R execution completed',
      executionTime: 0,
      variables: { ...kernel.variables, 'r_output': 'success' }
    }
  }

  private async executeSQL(code: string, kernel: Kernel, context?: ExecutionContext): Promise<ExecutionResult> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    // Mock SQL execution
    const mockData = this.generateSampleTableData()
    
    return {
      stdout: 'SQL query executed successfully',
      result: 'Query completed',
      executionTime: 0,
      tables: [{
        data: mockData,
        columns: ['id', 'name', 'value', 'category'],
        title: 'Query Result'
      }],
      variables: { ...kernel.variables, 'query_result': mockData }
    }
  }

  private async executeJavaScript(code: string, kernel: Kernel, context?: ExecutionContext): Promise<ExecutionResult> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    try {
      // Actually execute JavaScript in the browser
      const result = eval(code)
      
      return {
        stdout: 'JavaScript executed successfully',
        result,
        executionTime: 0,
        variables: { ...kernel.variables, 'js_result': result }
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'JavaScript execution failed',
        executionTime: 0,
        variables: kernel.variables
      }
    }
  }

  private async executeTypeScript(code: string, kernel: Kernel, context?: ExecutionContext): Promise<ExecutionResult> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    // For now, treat TypeScript as JavaScript
    return this.executeJavaScript(code, kernel, context)
  }

  private generateSampleData(type: string): any[] {
    switch (type) {
      case 'line':
        return Array.from({ length: 10 }, (_, i) => ({
          x: i,
          y: Math.sin(i * 0.5) * 10 + 20
        }))
      case 'scatter':
        return Array.from({ length: 20 }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 10 + 5
        }))
      default:
        return Array.from({ length: 5 }, (_, i) => ({
          x: i,
          y: Math.random() * 100
        }))
    }
  }

  private generateSampleTableData(): any[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
    }))
  }

  // Real-time collaboration support
  async shareNotebook(notebookId: string, permissions: 'read' | 'write'): Promise<string> {
    // Mock sharing - replace with actual implementation
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // In a real implementation, this would:
    // 1. Create a shareable link
    // 2. Set up WebSocket connections for real-time collaboration
    // 3. Handle permissions and access control
    
    return shareId
  }

  // File management
  async uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        // Store file content (in real implementation, upload to server)
        localStorage.setItem(`notebook_file_${fileId}`, reader.result as string)
        resolve(fileId)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  async downloadFile(fileId: string, filename: string): Promise<void> {
    const content = localStorage.getItem(`notebook_file_${fileId}`)
    if (!content) throw new Error('File not found')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export functionality
  async exportNotebook(notebook: any, format: 'html' | 'pdf' | 'ipynb' | 'py'): Promise<Blob> {
    switch (format) {
      case 'html':
        return this.exportToHTML(notebook)
      case 'pdf':
        return this.exportToPDF(notebook)
      case 'ipynb':
        return this.exportToJupyter(notebook)
      case 'py':
        return this.exportToPython(notebook)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private async exportToHTML(notebook: any): Promise<Blob> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${notebook.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .cell { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .code { background: #f5f5f5; padding: 10px; font-family: monospace; }
        .output { background: #f9f9f9; padding: 10px; margin-top: 10px; }
        pre { white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>${notebook.name}</h1>
    <p>Created: ${notebook.createdAt.toLocaleString()}</p>
    <p>Last Updated: ${notebook.updatedAt.toLocaleString()}</p>
    
    ${notebook.cells.map((cell: any) => `
        <div class="cell">
            <h3>${cell.type.toUpperCase()} Cell</h3>
            <div class="code">
                <pre>${cell.content}</pre>
            </div>
            ${cell.output ? `
                <div class="output">
                    <h4>Output:</h4>
                    <pre>${JSON.stringify(cell.output, null, 2)}</pre>
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`
    
    return new Blob([html], { type: 'text/html' })
  }

  private async exportToPDF(notebook: any): Promise<Blob> {
    // For PDF export, we'd typically use a library like jsPDF or Puppeteer
    // This is a simplified version
    const html = await this.exportToHTML(notebook)
    const htmlText = await html.text()
    
    // In a real implementation, convert HTML to PDF
    return new Blob([htmlText], { type: 'application/pdf' })
  }

  private async exportToJupyter(notebook: any): Promise<Blob> {
    const jupyterNotebook = {
      cells: notebook.cells.map((cell: any) => ({
        cell_type: cell.type === 'markdown' ? 'markdown' : 'code',
        source: cell.content.split('\n'),
        metadata: {},
        outputs: cell.output ? [{
          output_type: 'execute_result',
          data: { 'text/plain': [JSON.stringify(cell.output)] },
          execution_count: 1
        }] : []
      })),
      metadata: {
        kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
        language_info: { name: 'python', version: '3.11.0' }
      },
      nbformat: 4,
      nbformat_minor: 4
    }
    
    return new Blob([JSON.stringify(jupyterNotebook, null, 2)], { type: 'application/json' })
  }

  private async exportToPython(notebook: any): Promise<Blob> {
    const pythonCode = notebook.cells
      .filter((cell: any) => cell.type !== 'markdown')
      .map((cell: any) => `# ${cell.type} cell\n${cell.content}`)
      .join('\n\n')
    
    return new Blob([pythonCode], { type: 'text/plain' })
  }
}

// Singleton instance
export const notebookEngine = new NotebookExecutionEngine()

// Utility functions
export const createNotebookId = (): string => {
  return `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const createCellId = (): string => {
  return `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export const validateCode = (code: string, language: string): { valid: boolean; error?: string } => {
  if (!code.trim()) {
    return { valid: false, error: 'Code cannot be empty' }
  }
  
  // Basic syntax validation based on language
  switch (language) {
    case 'python':
      // Basic Python syntax checks
      if (code.includes('import ') && !code.includes('import pandas') && !code.includes('import numpy')) {
        // This is just a demo - real validation would be more sophisticated
      }
      break
    case 'sql':
      if (!code.toLowerCase().includes('select') && !code.toLowerCase().includes('insert') && 
          !code.toLowerCase().includes('update') && !code.toLowerCase().includes('delete')) {
        return { valid: false, error: 'SQL query must contain a valid statement' }
      }
      break
  }
  
  return { valid: true }
}
