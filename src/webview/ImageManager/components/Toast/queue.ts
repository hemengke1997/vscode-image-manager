import { type ToastProps } from '.'

export type ToastMessageType = ToastProps & {
  id: number
}

class Queue {
  _messages: ToastMessageType[]
  _uniqueId: number

  constructor() {
    this._messages = []
    this._uniqueId = 0
  }

  push(message: Omit<ToastMessageType, 'id'>) {
    this._messages.push({ id: this._uniqueId++, ...message })
  }

  get length() {
    return this._messages.length
  }

  get first() {
    return this._messages[0]
  }

  shift() {
    return this._messages.shift()
  }
}

export default Queue
