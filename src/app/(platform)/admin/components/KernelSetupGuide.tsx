'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Terminal,
  Server,
  Code,
  Database,
  FileCode,
  Globe,
  Shield,
  Key,
  Settings,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  Package,
  Server as Docker,
  GitBranch,
  Zap,
  Monitor,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { showSuccess, ToastMessages } from '@/lib/toast-utils'

interface SetupGuideProps {
  onClose?: () => void
}

export function KernelSetupGuide({ onClose }: SetupGuideProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quick-start']))

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(ToastMessages.COPIED)
  }

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    showSuccess(`Downloaded ${filename}`)
  }

  const setupScripts = {
    python: `#!/bin/bash
# Python Kernel Setup Script
# This script sets up a Python kernel server for notebook execution

set -e

echo "🐍 Setting up Python Kernel Server..."

# Update system packages
sudo apt-get update

# Install Python 3.11 and pip
sudo apt-get install -y python3.11 python3.11-pip python3.11-venv

# Create virtual environment
python3.11 -m venv /opt/python-kernel
source /opt/python-kernel/bin/activate

# Install Jupyter and data science packages
pip install --upgrade pip
pip install jupyter jupyterlab
pip install pandas numpy matplotlib seaborn scikit-learn plotly
pip install ipykernel

# Create kernel configuration
mkdir -p /opt/python-kernel/config
cat > /opt/python-kernel/config/jupyter_lab_config.py << EOF
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8888
c.ServerApp.open_browser = False
c.ServerApp.allow_root = True
c.ServerApp.token = 'kernel-token-123'
c.ServerApp.password = ''
c.ServerApp.disable_check_xsrf = True
c.ServerApp.allow_origin = '*'
EOF

# Create systemd service
sudo tee /etc/systemd/system/python-kernel.service > /dev/null << EOF
[Unit]
Description=Python Kernel Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/python-kernel
Environment=PATH=/opt/python-kernel/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/opt/python-kernel/bin/jupyter lab --config=/opt/python-kernel/config/jupyter_lab_config.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable python-kernel
sudo systemctl start python-kernel

echo "✅ Python kernel server setup complete!"
echo "🌐 Access at: http://localhost:8888"
echo "🔑 Token: kernel-token-123"
echo "📊 Status: sudo systemctl status python-kernel"`,

    r: `#!/bin/bash
# R Kernel Setup Script
# This script sets up an R kernel server for statistical analysis

set -e

echo "📊 Setting up R Kernel Server..."

# Update system packages
sudo apt-get update

# Install R and RStudio Server dependencies
sudo apt-get install -y r-base r-base-dev
sudo apt-get install -y gdebi-core

# Download and install RStudio Server
wget https://download2.rstudio.org/server/bionic/amd64/rstudio-server-2023.09.1-494-amd64.deb
sudo gdebi -n rstudio-server-2023.09.1-494-amd64.deb

# Install R packages
sudo R -e "install.packages(c('ggplot2', 'dplyr', 'tidyr', 'shiny', 'rmarkdown', 'knitr'), repos='https://cran.rstudio.com/')"

# Create R kernel configuration
sudo mkdir -p /etc/rstudio-server
sudo tee /etc/rstudio-server/rserver.conf > /dev/null << EOF
www-port=8787
www-address=0.0.0.0
auth-none=1
auth-validate-users=0
EOF

# Create health check script
sudo tee /usr/local/bin/r-kernel-health.sh > /dev/null << 'EOF'
#!/bin/bash
curl -f http://localhost:8787/health || exit 1
EOF
sudo chmod +x /usr/local/bin/r-kernel-health.sh

# Start RStudio Server
sudo systemctl enable rstudio-server
sudo systemctl start rstudio-server

echo "✅ R kernel server setup complete!"
echo "🌐 Access at: http://localhost:8787"
echo "📊 Status: sudo systemctl status rstudio-server"`,

    julia: `#!/bin/bash
# Julia Kernel Setup Script
# This script sets up a Julia kernel server for high-performance computing

set -e

echo "⚡ Setting up Julia Kernel Server..."

# Update system packages
sudo apt-get update

# Install Julia
wget https://julialang-s3.julialang.org/bin/linux/x64/1.9/julia-1.9.0-linux-x86_64.tar.gz
tar -xzf julia-1.9.0-linux-x86_64.tar.gz
sudo mv julia-1.9.0 /opt/julia
sudo ln -sf /opt/julia/bin/julia /usr/local/bin/julia

# Install Jupyter and Julia packages
pip3 install jupyter jupyterlab
julia -e "using Pkg; Pkg.add([\"IJulia\", \"Plots\", \"DataFrames\", \"Flux\", \"DifferentialEquations\", \"JuMP\"])"

# Create Julia kernel configuration
mkdir -p /opt/julia-kernel/config
cat > /opt/julia-kernel/config/jupyter_lab_config.py << EOF
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8890
c.ServerApp.open_browser = False
c.ServerApp.allow_root = True
c.ServerApp.token = 'julia-token-123'
c.ServerApp.password = ''
c.ServerApp.disable_check_xsrf = True
c.ServerApp.allow_origin = '*'
EOF

# Create systemd service
sudo tee /etc/systemd/system/julia-kernel.service > /dev/null << EOF
[Unit]
Description=Julia Kernel Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/julia-kernel
Environment=PATH=/opt/julia/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/local/bin/julia --project=. -e "using IJulia; IJulia.notebook()"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable julia-kernel
sudo systemctl start julia-kernel

echo "✅ Julia kernel server setup complete!"
echo "🌐 Access at: http://localhost:8890"
echo "🔑 Token: julia-token-123"
echo "📊 Status: sudo systemctl status julia-kernel"`,

    docker: `#!/bin/bash
# Docker-based Kernel Setup Script
# This script sets up multiple kernel servers using Docker

set -e

echo "🐳 Setting up Docker-based Kernel Servers..."

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  python-kernel:
    image: jupyter/scipy-notebook:latest
    container_name: python-kernel
    ports:
      - "8888:8888"
    environment:
      - JUPYTER_ENABLE_LAB=yes
      - JUPYTER_TOKEN=python-token-123
    volumes:
      - ./notebooks:/home/jovyan/work
      - ./data:/home/jovyan/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  r-kernel:
    image: rocker/rstudio:latest
    container_name: r-kernel
    ports:
      - "8787:8787"
    environment:
      - PASSWORD=r-password-123
    volumes:
      - ./notebooks:/home/rstudio/notebooks
      - ./data:/home/rstudio/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8787/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  julia-kernel:
    image: julia:1.9-bullseye
    container_name: julia-kernel
    ports:
      - "8890:8888"
    environment:
      - JUPYTER_ENABLE_LAB=yes
      - JUPYTER_TOKEN=julia-token-123
    volumes:
      - ./notebooks:/home/jovyan/work
      - ./data:/home/jovyan/data
    command: >
      bash -c "
        pip install jupyter jupyterlab &&
        julia -e 'using Pkg; Pkg.add([\"IJulia\", \"Plots\", \"DataFrames\"])' &&
        julia -e 'using IJulia; IJulia.notebook()'
      "
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "julia", "-e", "println(\"Julia is running\")"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Create directories
mkdir -p notebooks data

# Start services
docker-compose up -d

echo "✅ Docker-based kernel servers setup complete!"
echo "🐍 Python: http://localhost:8888 (token: python-token-123)"
echo "📊 R: http://localhost:8787 (password: r-password-123)"
echo "⚡ Julia: http://localhost:8890 (token: julia-token-123)"
echo "📊 Status: docker-compose ps"`
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Kernel Setup Guide
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive guide to setting up remote kernel servers for notebook execution
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <XCircle className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Supported Languages</span>
            </div>
            <div className="text-2xl font-bold mt-1">4+</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Docker className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Docker Support</span>
            </div>
            <div className="text-2xl font-bold mt-1">Yes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Security</span>
            </div>
            <div className="text-2xl font-bold mt-1">Enterprise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Setup Time</span>
            </div>
            <div className="text-2xl font-bold mt-1">5 min</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="r">R</TabsTrigger>
          <TabsTrigger value="julia">Julia</TabsTrigger>
          <TabsTrigger value="docker">Docker</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                What are Kernel Servers?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Kernel servers are remote execution environments that run your code in isolated, 
                scalable containers. They provide the computational power for your notebook cells 
                and can be shared across multiple users and projects.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700">Benefits</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Scalable compute resources
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Isolated execution environments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Multi-language support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resource monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Easy deployment and management
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700">Use Cases</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-blue-500" />
                      Data science and analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      Machine learning model training
                    </li>
                    <li className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-500" />
                      Statistical analysis and reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      High-performance computing
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      Collaborative data science
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Option 1: Docker (Recommended)</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Fastest way to get started with pre-configured kernel servers
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => downloadScript(setupScripts.docker, 'docker-kernels.sh')}>
                      <Download className="h-4 w-4 mr-1" />
                      Download Script
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(setupScripts.docker)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Script
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Option 2: Manual Installation</h4>
                  <p className="text-green-800 text-sm mb-3">
                    Full control over the installation process and configuration
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" onClick={() => setActiveTab('python')}>
                      <FileCode className="h-4 w-4 mr-1" />
                      Python
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab('r')}>
                      <Database className="h-4 w-4 mr-1" />
                      R
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab('julia')}>
                      <Zap className="h-4 w-4 mr-1" />
                      Julia
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-500" />
                Python Kernel Setup
              </CardTitle>
              <CardDescription>
                Set up a Python kernel server with popular data science libraries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => downloadScript(setupScripts.python, 'python-kernel-setup.sh')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Script
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(setupScripts.python)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Script
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {setupScripts.python}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">What this script installs:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Jupyter Lab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Pandas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">NumPy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Matplotlib</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Seaborn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Scikit-learn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Plotly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">IPython Kernel</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="r" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                R Kernel Setup
              </CardTitle>
              <CardDescription>
                Set up an R kernel server for statistical analysis and reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => downloadScript(setupScripts.r, 'r-kernel-setup.sh')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Script
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(setupScripts.r)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Script
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {setupScripts.r}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">What this script installs:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">R Base</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">RStudio Server</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">ggplot2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">dplyr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">tidyr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">shiny</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">rmarkdown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">knitr</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="julia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-500" />
                Julia Kernel Setup
              </CardTitle>
              <CardDescription>
                Set up a Julia kernel server for high-performance computing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => downloadScript(setupScripts.julia, 'julia-kernel-setup.sh')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Script
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(setupScripts.julia)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Script
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {setupScripts.julia}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">What this script installs:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Julia 1.9</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">IJulia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Plots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">DataFrames</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Flux</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">DifferentialEquations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">JuMP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Jupyter Lab</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Docker className="h-5 w-5 text-blue-500" />
                Docker-based Setup
              </CardTitle>
              <CardDescription>
                Set up multiple kernel servers using Docker containers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => downloadScript(setupScripts.docker, 'docker-kernels.sh')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Script
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(setupScripts.docker)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Script
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {setupScripts.docker}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">What this script creates:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Docker className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Python kernel container (port 8888)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Docker className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">R kernel container (port 8787)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Docker className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Julia kernel container (port 8890)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Docker className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Health checks for all containers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Docker className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Volume mounts for notebooks and data</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced configuration options for production deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Security Configuration</h4>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-900 mb-2">Authentication Methods</h5>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• <strong>Token-based:</strong> Secure random tokens for API access</li>
                    <li>• <strong>OAuth 2.0:</strong> Enterprise SSO integration</li>
                    <li>• <strong>Basic Auth:</strong> Username/password authentication</li>
                    <li>• <strong>Certificate:</strong> Client certificate authentication</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Performance Tuning</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Resource Limits</h5>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• <strong>CPU:</strong> Set appropriate CPU limits for each kernel</li>
                    <li>• <strong>Memory:</strong> Configure memory limits to prevent OOM</li>
                    <li>• <strong>Disk:</strong> Set disk quotas for temporary files</li>
                    <li>• <strong>Network:</strong> Configure network bandwidth limits</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Monitoring & Logging</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Health Monitoring</h5>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• <strong>Health Checks:</strong> Regular endpoint monitoring</li>
                    <li>• <strong>Metrics:</strong> CPU, memory, and disk usage tracking</li>
                    <li>• <strong>Logging:</strong> Structured logging with different levels</li>
                    <li>• <strong>Alerting:</strong> Automated alerts for failures</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Scaling & Load Balancing</h4>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-2">Production Deployment</h5>
                  <ul className="space-y-1 text-sm text-purple-800">
                    <li>• <strong>Load Balancer:</strong> Distribute requests across multiple kernels</li>
                    <li>• <strong>Auto-scaling:</strong> Automatically scale based on demand</li>
                    <li>• <strong>High Availability:</strong> Multi-region deployment</li>
                    <li>• <strong>Backup:</strong> Regular backup of kernel configurations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
