import { ObserverClass } from 'models/observers'
import { EventReocrd, EventTypes } from 'models/observers/event'
import { EventObserveOptions, Listener } from 'models/observers/event'
import { ElementX, FormELement } from 'models/friday'
import { _throttle, _log } from 'tools/helpers'
import FridayDocument from 'tools/document'

const { getFridayIdByNode } = FridayDocument

/**
 * Observe scroll, click, mousemove, window resize, form change(input/textarea/radio etc.)
 * and produce an Record
 **/
export default class EventObserver implements ObserverClass {
  public name: string = 'EventObserver'
  private listeners: Listener[] = []
  public active: boolean

  constructor(
    public onobserved,
    public readonly options: EventObserveOptions | boolean = {
      scroll: true,
      click: true,
      move: true,
      resize: true,
      form: true
    }
  ) {
    if (options === false) return
    this.install()
  }

  /**
   * @param option useCapture or AddEventListenerOptions
   */
  private addListener = ({
    target,
    event,
    callback,
    options = false
  }: Listener) => {
    target.addEventListener(event, callback, options)

    this.listeners.push({
      target,
      event,
      callback
    })
  }

  /** Provide that Document's direction is `rtl`(default) */
  private getScrollPosition = (): { x: number; y: number } => {
    // Quirks mode on the contrary
    const isStandardsMode = document.compatMode === 'CSS1Compat'

    const x = isStandardsMode
      ? document.documentElement.scrollLeft
      : document.body.scrollLeft
    const y = isStandardsMode
      ? document.documentElement.scrollTop
      : document.body.scrollTop

    return { x, y }
  }

  private getScrollRecord = (evt?: Event): void => {
    const { target } = evt || { target: document }
    const { onobserved } = this

    let record = { type: EventTypes.scroll } as EventReocrd

    // If target is docuemnt or Non-event invoking
    if (target === document || !target) {
      let { x, y } = this.getScrollPosition()
      record = { ...record, x, y }
      onobserved(record)
      return
    }

    let targetX = target as ElementX
    const { scrollLeft: x, scrollTop: y } = targetX
    const fridayId = getFridayIdByNode(targetX)

    record = { ...record, x, y, target: fridayId }

    onobserved(record)
  }

  private getMouseClickRecord = (evt: MouseEvent): void => {
    const { pageX: x, pageY: y } = evt
    const record: EventReocrd = { type: EventTypes.click, x, y }

    this.onobserved(record)
  }

  private getMouseMoveRecord = (evt: MouseEvent): void => {
    const { pageX: x, pageY: y } = evt
    const record: EventReocrd = { type: EventTypes.move, x, y }

    this.onobserved(record)
  }

  private getResizeRecord = (): void => {
    const { clientWidth: w, clientHeight: h } = document.documentElement
    const record: EventReocrd = { type: EventTypes.resize, w, h }

    this.onobserved(record)
  }

  private getFormChangeRecord = (evt: Event): void => {
    const { target } = evt
    const fridayId = getFridayIdByNode(target)

    let k, v

    if (!fridayId) return

    const itemsWhichKeyIsChecked = ['radio', 'checked']

    const targetX = target as FormELement
    const { type: formType } = targetX
    if (itemsWhichKeyIsChecked.includes(formType)) {
      k = 'checked'
      v = targetX.checked
    } else {
      k = 'value'
      v = targetX.value
    }

    const record: EventReocrd = {
      type: EventTypes.form,
      target: fridayId,
      k,
      v
    }

    this.onobserved(record)
  }

  install(): void {
    const { addListener } = this

    const { scroll, click, move, resize, form } = this
      .options as EventObserveOptions

    if (scroll) {
      addListener({
        target: document,
        event: 'scroll',
        callback: _throttle(this.getScrollRecord),
        options: true
      })
      /** Non-event invoking in order to get initial document's scroll position */
      this.getScrollRecord()
    }

    if (click) {
      addListener({
        target: document,
        event: 'click',
        callback: this.getMouseClickRecord
      })
    }

    if (move) {
      addListener({
        target: document,
        event: 'mousemove',
        callback: _throttle(this.getMouseMoveRecord, 1000)
      })
    }

    if (resize) {
      addListener({
        target: window,
        event: 'resize',
        callback: _throttle(this.getResizeRecord)
      })
      /** Get viewport size primitively */
      this.getResizeRecord()
    }

    if (form) {
      addListener({
        target: document,
        event: 'change',
        callback: this.getFormChangeRecord,
        options: true
      })
    }

    _log('events installed!')
    this.active = true
  }

  uninstall() {
    this.listeners.forEach(({ target, event, callback }) => {
      target.removeEventListener(event, callback)
    })
    this.active = false
  }
}
