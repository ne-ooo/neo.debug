import type { createDebug } from './env/node.js' with { 'resolution-mode': 'import' }
import type {
  Debugger as DebuggerType,
  DebugFactory as DebugFactoryType,
} from './types.js' with { 'resolution-mode': 'import' }

interface CommonJsDebugFactory extends DebugFactoryType {
  readonly default: CommonJsDebugFactory
  readonly debug: typeof createDebug
}

declare const factory: CommonJsDebugFactory

declare namespace factory {
  export type Debugger = DebuggerType
  export type DebugFactory = DebugFactoryType
}

export = factory
