import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const appPath = fileURLToPath(new URL('../src/App.tsx', import.meta.url))
const scriptPath = fileURLToPath(import.meta.url)
const workflowPath = fileURLToPath(new URL('../.github/workflows/apply-mobile-environment-fix.yml', import.meta.url))

let source = fs.readFileSync(appPath, 'utf8')

const oldImport = "import { Environment, RoundedBox, Text } from '@react-three/drei'"
const newImport = "import { RoundedBox, Text } from '@react-three/drei'"
const canvasStart = '<Canvas shadows camera='
const safeCanvasStart = '<Canvas fallback={<div style={{ display: \'grid\', placeItems: \'center\', height: \'100%\', color: \'#aeb7c4\', fontFamily: \'monospace\' }}>3D dice are unavailable on this device.</div>} shadows camera='
const remoteEnvironment = '<Environment preset="warehouse" />'

if (!source.includes(oldImport)) throw new Error('Expected Drei import was not found')
if (!source.includes(canvasStart)) throw new Error('Expected Canvas opening was not found')
if (!source.includes(remoteEnvironment)) throw new Error('Expected remote Environment preset was not found')

source = source
  .replace(oldImport, newImport)
  .replace(canvasStart, safeCanvasStart)
  .replace(remoteEnvironment, '')

fs.writeFileSync(appPath, source)
fs.rmSync(scriptPath)
fs.rmSync(workflowPath)
