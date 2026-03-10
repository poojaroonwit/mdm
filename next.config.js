/** @type {import('next').NextConfig} */
// Force restart - triggered update 23
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      // Allow MinIO image from environment variable
      ...(process.env.MINIO_ENDPOINT ? (() => {
        try {
          const url = new URL(process.env.MINIO_ENDPOINT);
          return [{
            protocol: url.protocol.replace(':', ''),
            hostname: url.hostname,
            port: url.port,
          }];
        } catch (e) {
          // If not a valid URL, assume it's a hostname
          return [{
            protocol: 'http',
            hostname: process.env.MINIO_ENDPOINT,
          }, {
            protocol: 'https',
            hostname: process.env.MINIO_ENDPOINT,
          }];
        }
      })() : []),
    ],
  },
  typescript: {
    // Show all TypeScript errors during build (don't ignore, but don't stop)
    ignoreBuildErrors: true,
    // TypeScript will show all errors, build will continue to collect all errors
  },

  // Expose package version to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },

  // Disable output file tracing for local builds to avoid Windows permission issues
  // Disable output file tracing for local builds to avoid Windows permission issues
  output: process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD ? 'standalone' : undefined,
  // Add empty turbopack config to silence Next.js 16 warning (we use webpack)
  turbopack: {},

  // ========== BUILD OPTIMIZATION FOR LOWER RAM/CPU USAGE ==========
  // Experimental features for better build performance
  experimental: {
    // Reduce memory usage by limiting concurrent workers (Production Only)
    webpackBuildWorker: true,
    // Enable parallel routes for better route optimization (Disable in dev for speed)
    parallelServerBuildTraces: process.env.NODE_ENV === 'production' ? false : true,
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'date-fns',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'recharts',
      '@xyflow/react',
    ],
  },

  // Disable source maps to save memory and space used during build
  productionBrowserSourceMaps: false,

  // Disable inline source maps as well
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Reduce server components bundle size by keeping heavy libraries out of the bundle
  serverExternalPackages: [
    'ssh2-sftp-client',
    'ftp',
    'ssh2',
    '@prisma/client',
    'puppeteer',
    'xlsx',
    'mysql2',
    '@elastic/elasticsearch',
    // Add heavy SDKs to externals to reduce bundle memory usage
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'openai',
    'langfuse',
    'minio',
  ],

  webpack: (config, { isServer, webpack }) => {
    // Exclude plugin-hub directory from build analysis (it's a separate service)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        // '**/plugin-hub/**', // ALLOW PLUGIN HUB FOR EXTERNAL PLUGINS
      ],
    }

    // CRITICAL: Don't bail on first error - show all errors
    config.bail = false

    // Configure stats to show all errors and warnings with full details
    if (!config.stats) {
      config.stats = {}
    }
    config.stats.errors = true
    config.stats.warnings = true
    config.stats.errorDetails = true
    config.stats.errorStack = true
    config.stats.warningsFilter = [] // Show all warnings
    config.stats.colors = true
    config.stats.modules = false
    config.stats.chunks = false
    config.stats.assets = false
    config.stats.all = false // Don't show everything, just errors/warnings
    config.stats.preset = false // Disable presets to use custom config

    // Enhanced error reporting - show all errors
    config.infrastructureLogging = {
      level: 'error',
    }

    // Collect all errors before failing
    config.optimization = config.optimization || {}
    config.optimization.removeAvailableModules = false
    config.optimization.removeEmptyChunks = false


    // ========== CHUNKING CONFIGURATION FOR LOWER RAM/CPU USAGE ==========
    // Split large bundles into smaller chunks to reduce memory during build
    // ONLY APPLY IN PRODUCTION - Development needs faster HMR
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization.splitChunks = {
        chunks: 'all',
        // Reduce max chunk size to lower memory usage
        maxSize: 100 * 1024, // 100KB per chunk - smaller chunks use less memory
        minSize: 10 * 1024,  // 10KB minimum
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // Separate large vendor libraries into their own chunks
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            priority: 40,
            chunks: 'all',
            enforce: true,
          },
          // UI libraries chunk
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|react-icons|@tiptap|recharts|@xyflow)[\\/]/,
            name: 'ui-libs',
            priority: 30,
            chunks: 'all',
          },
          // Utilities chunk
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority|tailwind-merge|zod)[\\/]/,
            name: 'utils',
            priority: 20,
            chunks: 'all',
          },
          // Other vendor libraries
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
            reuseExistingChunk: true,
            enforce: true,
          },
          // Common components shared across pages
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // Reduce parallelism to lower RAM usage during build (Production only)
    if (process.env.NODE_ENV === 'production') {
      config.parallelism = 1 // Set to 1 for maximum memory efficiency
    }

    // Custom error handling to collect all errors
    const originalEmit = config.plugins?.find(p => p.constructor.name === 'ForkTsCheckerWebpackPlugin')
    if (originalEmit) {
      // If ForkTsCheckerWebpackPlugin exists, configure it to collect all errors
      originalEmit.options = originalEmit.options || {}
      originalEmit.options.async = true // Don't block build, collect all errors
      originalEmit.options.typescript = {
        ...originalEmit.options.typescript,
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      }
    }

    // Override webpack's error handling to collect all errors
    const originalOnError = config.infrastructureLogging
    if (config.plugins) {
      // Add a plugin to collect all compilation errors
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.done.tap('CollectAllErrors', (stats) => {
            if (stats.hasErrors()) {
              const errors = stats.compilation.errors
              if (errors.length > 0) {
                console.error(`\n\n=== Found ${errors.length} error(s) ===\n`)
              }
            }
          })
        },
      })
    }

    if (isServer) {
      // Ignore client-only packages on server
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
      // Ignore plugin-hub directory (separate service) - prevent any resolution attempts
      // ALLOW PLUGIN HUB FOR EXTERNAL PLUGINS
      // config.plugins.push(
      //   new webpack.IgnorePlugin({
      //     resourceRegExp: /plugin-hub/,
      //   })
      // )
      // Also add to externals to prevent any module resolution
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals].filter(Boolean)
      }
      // ALLOW PLUGIN HUB FOR EXTERNAL PLUGINS
      // config.externals.push(({ request }, callback) => {
      //   if (request && request.includes('plugin-hub')) {
      //     return callback(null, 'commonjs ' + request)
      //   }
      //   callback()
      // })
      // Exclude native modules from server bundle - mark Node.js built-ins as external
      config.externals = config.externals || []
      config.externals.push('ssh2-sftp-client', 'ftp', 'ssh2', 'child_process')
      // Mark Node.js built-in modules as external (they're available at runtime)
      const nodeBuiltins = ['crypto', 'fs', 'path', 'util', 'stream', 'os', 'net', 'tls', 'http', 'https', 'zlib', 'url', 'assert']
      nodeBuiltins.forEach(module => {
        if (!config.externals.includes(module)) {
          config.externals.push(module)
        }
      })
    } else {
      // For client-side builds, configure fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        util: false,
      }
      // Ignore child_process and util on client side
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(child_process|util)$/,
        })
      )
    }

    // Handle mqtt and socket.io-client - they use dynamic imports
    // Use IgnorePlugin to prevent webpack from trying to resolve them during build
    // Dynamic imports at runtime will still work because they bypass webpack
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(mqtt|socket\.io-client)$/,
        contextRegExp: /src\/features\/api-client/,
      })
    )

    // Suppress critical dependency warnings for external-plugin-loader.ts
    // These warnings are expected because we intentionally use dynamic requires for plugin loading
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /external-plugin-loader\.ts/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ]

    return config
  },
  // HTTP Headers to prevent search engine indexing
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
        ],
      },
    ]
  },
  // Rewrites to bypass Nginx /api collision
  async rewrites() {
    return []
  },

  // Experimental: Continue build even with errors
  // Note: turbo config removed - use --webpack flag to avoid Turbopack
  // Logging configuration - disable request logs
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },
}

module.exports = nextConfig
