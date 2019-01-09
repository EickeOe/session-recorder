import { HighOrderObserver } from '../models/observers'
import {
  ConsoleObserveOptions,
  ConsoleTypes,
  ConsoleRecord,
  ConsoleLevels
} from '../models/observers/console'
import { _replace, _recover, _log } from '../tools/helpers'
import BasicObserverClass from './';
import { RECORDER_OPTIONS } from '../constants';

export default class ConsoleObserverClass extends BasicObserverClass implements HighOrderObserver {
  public name: string = 'ConsoleObserverClass'
  private consoleLevels: string[] = Object.keys(ConsoleLevels)
  public options: ConsoleObserveOptions = {
    info: true,
    error: true,
    log: false,
    warn: true,
    debug: false
  }
  public status = RECORDER_OPTIONS.console

  constructor(options: ConsoleObserveOptions | boolean) {
    super()
    if (options === false) return

    Object.assign(this.options, options)
  }

  public install(): void {
    const { status, $emit } = this

    this.consoleLevels.forEach(
      (level: keyof ConsoleObserveOptions): void => {
        if (!this.options[level]) return

        function consoleReplacement(originalConsoleFunc: Function) {
          return function(...args: any[]) {
            if (!args.length) return

            const record: ConsoleRecord = {
              type: ConsoleTypes.console,
              l: level as ConsoleLevels,
              msg: args
            }

            $emit('observed', record)

            if (originalConsoleFunc) {
              originalConsoleFunc.call(console, ...args)
            }
          }
        }

        _replace(console, level, consoleReplacement)

        status[level] = true
      }
    )
    _log('console observer ready!')
  }

  public uninstall(): void {
    this.consoleLevels.forEach(
      (level: keyof ConsoleObserveOptions): void => {
        if (!this.options[level]) return

        _recover(console, level)

        status[level] = false
      }
    )
  }
}
