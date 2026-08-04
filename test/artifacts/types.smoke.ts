import debug, {
  debug as createDebug,
  disable,
  enable,
  type DebugFactory,
  type Debugger,
} from '@lpm.dev/neo.debug'

const factory: DebugFactory = debug
const logger: Debugger = createDebug('types:smoke')

enable('types:*')
factory('types:factory')('message')
logger('message')
disable()
