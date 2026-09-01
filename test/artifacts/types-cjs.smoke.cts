import debug = require('@lpm.dev/neo.debug')

const factory: debug.DebugFactory = debug
const logger: debug.Debugger = factory('types:cjs')

factory.enable('types:*')
debug.debug('types:named')('message')
debug.default.debug('types:nested-named')('message')
debug.default.default('types:nested-default')('message')
logger('message')
factory.disable()
