/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */

/* Versão otimizada para CI baseada no arquivo gerado por NAPI-RS */

const { existsSync, readFileSync, readdirSync } = require('fs')
const { join } = require('path')

const { platform, arch } = process

let nativeBinding = null
let localFileExisted = false
let loadError = null

// Função auxiliar para encontrar qualquer arquivo .node compatível
function findCompatibleBinary(platformPrefix) {
  const files = readdirSync(__dirname).filter(f => f.endsWith('.node') && f.includes(platformPrefix));
  return files.length > 0 ? files[0] : null;
}

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
  case 'win32':
    switch (arch) {
      case 'x64':
        localFileExisted = existsSync(
          join(__dirname, 'mussurana_cache.win32-x64-msvc.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./mussurana_cache.win32-x64-msvc.node')
          } else {
            // Tenta encontrar qualquer arquivo .node compatível
            const compatibleBinary = findCompatibleBinary('win32');
            if (compatibleBinary) {
              nativeBinding = require(`./${compatibleBinary}`);
            } else {
              throw new Error('Nenhum binário compatível encontrado para Windows x64');
            }
          }
        } catch (e) {
          loadError = e
        }
        break
      default:
        throw new Error(`Unsupported architecture on Windows: ${arch}`)
    }
    break
  case 'darwin':
    // Tenta primeiro o universal binary
    localFileExisted = existsSync(join(__dirname, 'mussurana_cache.darwin-universal.node'))
    try {
      if (localFileExisted) {
        nativeBinding = require('./mussurana_cache.darwin-universal.node')
        break
      }
    } catch {}

    // Depois tenta arquitetura específica
    switch (arch) {
      case 'x64':
        localFileExisted = existsSync(join(__dirname, 'mussurana_cache.darwin-x64.node'))
        try {
          if (localFileExisted) {
            nativeBinding = require('./mussurana_cache.darwin-x64.node')
          } else {
            // Tenta encontrar qualquer arquivo .node compatível para darwin
            const compatibleBinary = findCompatibleBinary('darwin');
            if (compatibleBinary) {
              nativeBinding = require(`./${compatibleBinary}`);
            } else {
              throw new Error('Nenhum binário compatível encontrado para macOS x64');
            }
          }
        } catch (e) {
          loadError = e
        }
        break
      case 'arm64':
        localFileExisted = existsSync(
          join(__dirname, 'mussurana_cache.darwin-arm64.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./mussurana_cache.darwin-arm64.node')
          } else {
            // Tenta encontrar qualquer arquivo .node compatível para darwin
            const compatibleBinary = findCompatibleBinary('darwin');
            if (compatibleBinary) {
              nativeBinding = require(`./${compatibleBinary}`);
            } else {
              throw new Error('Nenhum binário compatível encontrado para macOS arm64');
            }
          }
        } catch (e) {
          loadError = e
        }
        break
      default:
        throw new Error(`Unsupported architecture on macOS: ${arch}`)
    }
    break
  case 'linux':
    switch (arch) {
      case 'x64':
        if (isMusl()) {
          localFileExisted = existsSync(
            join(__dirname, 'mussurana_cache.linux-x64-musl.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./mussurana_cache.linux-x64-musl.node')
            } else {
              // Tenta encontrar qualquer arquivo .node compatível
              const compatibleBinary = findCompatibleBinary('linux');
              if (compatibleBinary) {
                nativeBinding = require(`./${compatibleBinary}`);
              } else {
                throw new Error('Nenhum binário compatível encontrado para Linux musl x64');
              }
            }
          } catch (e) {
            loadError = e
          }
        } else {
          localFileExisted = existsSync(
            join(__dirname, 'mussurana_cache.linux-x64-gnu.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./mussurana_cache.linux-x64-gnu.node')
            } else {
              // Tenta encontrar qualquer arquivo .node compatível
              const compatibleBinary = findCompatibleBinary('linux');
              if (compatibleBinary) {
                nativeBinding = require(`./${compatibleBinary}`);
              } else {
                throw new Error('Nenhum binário compatível encontrado para Linux gnu x64');
              }
            }
          } catch (e) {
            loadError = e
          }
        }
        break
      default:
        throw new Error(`Unsupported architecture on Linux: ${arch}`)
    }
    break
  default:
    throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
}

if (!nativeBinding) {
  if (loadError) {
    throw loadError
  }
  throw new Error(`Failed to load native binding`)
}

const { MussuranaCache } = nativeBinding

module.exports.MussuranaCache = MussuranaCache
