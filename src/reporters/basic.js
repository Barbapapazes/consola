import util from 'util'
import { isPlainObject, parseStack, align } from '../utils'

export default class BasicReporter {
  constructor (options) {
    this.options = Object.assign({
      stream: process.stdout,
      errStream: process.stderr,
      alignment: 'left',
      showType: false
    }, options)
  }

  write (data, isError = false) {
    if (isError) {
      this.options.errStream.write(data)
    } else {
      this.options.stream.write(data)
    }
  }

  formatStack (stack) {
    return '> ' + parseStack(stack).join('\n> ')
  }

  format (arg) {
    if (isPlainObject(arg)) {
      return JSON.stringify(arg, null, 2)
    }

    if (util.formatWithOptions) {
      // Node >= 10
      return util.formatWithOptions({ colors: true }, arg)
    } else {
      return util.format(arg)
    }
  }

  getFields (logObj) {
    let message = logObj.message || ''
    let type = logObj.type || ''
    let tag = logObj.tag || ''
    let date = logObj.date.toLocaleTimeString()

    // Format args
    const args = logObj.args.map(arg => {
      // error-like argument
      if (arg.stack) {
        if (!message.length && arg.message) {
          message = arg.message
        }
        if (!type.length) {
          type = 'error'
        }
        return this.formatStack(arg.stack, { suffix: ' ↲' })
      }

      // General argument
      return this.format(arg)
    })

    // If no message is provided, assume args[0] as message
    if (!message.length && args.length) {
      message = args.shift()
    }

    return {
      args,
      date,
      message,
      tag,
      type
    }
  }

  log (logObj) {
    const fields = this.getFields(logObj)
    const { isError } = logObj

    // Print date
    this.write((`[${align(this.options.alignment, fields.date, 8)}] `), isError)

    // Print type
    if (fields.type.length) {
      this.write((`[${align(this.options.alignment, fields.type.toUpperCase(), 7)}] `), isError)
    }

    // Print tag
    if (fields.tag.length) {
      this.write(`[${fields.tag}] `, isError)
    }

    // Print message
    if (fields.message.length) {
      this.write(fields.message, isError)
    }

    // Print additional args
    if (fields.args.length) {
      this.write('\n' + (fields.args.join(' ')), isError)
    }

    // Newline
    this.write('\n', isError)
  }
}
