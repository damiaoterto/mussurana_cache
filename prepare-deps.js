const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Obtém a versão do package.json
const packageJson = require('../package.json')
const version = packageJson.version

// Configuração das plataformas
const platforms = [
  {
    input: 'bindings-x86_64-apple-darwin',
    output: 'darwin-x64',
    fileName: 'mussurana_cache.darwin-x64.node'
  },
  {
    input: 'bindings-x86_64-pc-windows-msvc',
    output: 'win32-x64-msvc',
    fileName: 'mussurana_cache.win32-x64-msvc.node'
  },
  {
    input: 'bindings-x86_64-unknown-linux-gnu',
    output: 'linux-x64-gnu',
    fileName: 'mussurana_cache.linux-x64-gnu.node'
  }
]

// Cria o diretório npm se não existir
if (!fs.existsSync('npm')) {
  fs.mkdirSync('npm')
}

// Processa cada plataforma
platforms.forEach(platform => {
  const targetDir = path.join('npm', platform.output)
  const artifactDir = path.join('artifacts', platform.input)

  // Cria o diretório de destino se não existir
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // Procura pelo arquivo .node correto na pasta de artefatos
  let nodeFiles = []
  if (fs.existsSync(artifactDir)) {
    nodeFiles = fs.readdirSync(artifactDir).filter(file => file.endsWith('.node'))
  }

  if (nodeFiles.length > 0) {
    // Copia o primeiro arquivo .node encontrado para o destino com o nome correto
    fs.copyFileSync(
      path.join(artifactDir, nodeFiles[0]),
      path.join(targetDir, platform.fileName)
    )
    console.log(`✅ Copied ${nodeFiles[0]} to ${platform.fileName}`)

    // Cria o package.json para a plataforma
    const platformPackage = {
      name: `@mussurana_cache/${platform.output}`,
      version,
      os: [platform.output.split('-')[0]],
      cpu: [platform.output.split('-')[1].replace('msvc', '')],
      main: platform.fileName,
      files: [platform.fileName],
      license: packageJson.license || 'MIT',
      engines: {
        node: '>= 18'
      }
    }

    fs.writeFileSync(
      path.join(targetDir, 'package.json'),
      JSON.stringify(platformPackage, null, 2)
    )
    console.log(`✅ Created package.json for ${platform.output}`)
  } else {
    console.error(`❌ No .node file found in ${artifactDir}`)
  }
})

// Cria o package.json principal para o pacote npm
const npmPackage = {
  name: packageJson.name,
  version,
  main: 'index.js',
  license: packageJson.license || 'MIT',
  repository: packageJson.repository,
  files: [
    'index.js',
    'index.d.ts',
    'npm/**/*'
  ],
  optionalDependencies: platforms.reduce((deps, platform) => {
    deps[`@mussurana_cache/${platform.output}`] = version
    return deps
  }, {}),
  engines: {
    node: '>= 18'
  }
}

fs.writeFileSync(
  path.join('npm', 'package.json'),
  JSON.stringify(npmPackage, null, 2)
)
console.log('✅ Created main package.json')

// Cria o index.js principal
const indexJs = `const { existsSync, readFileSync } = require('fs')
const { join } = require('path')

const { platform, arch } = process

let nativeBinding = null
let loadError = null

function isMusl() {
  // For Node 10
  if (!process.report || typeof process.report.getReport !== 'function') {
    try {
      const lddPath = require('child_process').execSync('which ldd').toString().trim()
      return readFileSync(lddPath, 'utf8').includes('musl')
    } catch (e) {
      return true
    }
  } else {
    const { glibcVersionRuntime } = process.report.getReport().header
    return !glibcVersionRuntime
  }
}

switch (platform) {
  case 'darwin':
    switch (arch) {
      case 'x64':
        nativeBinding = require('./npm/darwin-x64/mussurana_cache.darwin-x64.node')
        break
      default:
        throw new Error(\`Unsupported architecture on macOS: \${arch}\`)
    }
    break
  case 'win32':
    switch (arch) {
      case 'x64':
        nativeBinding = require('./npm/win32-x64-msvc/mussurana_cache.win32-x64-msvc.node')
        break
      default:
        throw new Error(\`Unsupported architecture on Windows: \${arch}\`)
    }
    break
  case 'linux':
    switch (arch) {
      case 'x64':
        nativeBinding = require('./npm/linux-x64-gnu/mussurana_cache.linux-x64-gnu.node')
        break
      default:
        throw new Error(\`Unsupported architecture on Linux: \${arch}\`)
    }
    break
  default:
    throw new Error(\`Unsupported OS: \${platform}, architecture: \${arch}\`)
}

module.exports = nativeBinding`

fs.writeFileSync(
  path.join('npm', 'index.js'),
  indexJs
)
console.log('✅ Created index.js')

// Copia o index.d.ts se existir
if (fs.existsSync('index.d.ts')) {
  fs.copyFileSync(
    'index.d.ts',
    path.join('npm', 'index.d.ts')
  )
  console.log('✅ Copied index.d.ts')
}

console.log('✨ Artifacts prepared for publishing')
