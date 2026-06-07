export const kernelSetupScripts = {
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
  } as const
