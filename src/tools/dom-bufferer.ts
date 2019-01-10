import { ID_KEY } from '../constants'
import { ElementX, DomTreeBufferer } from '../models'

/**
 * 1.Store initial document string with mark
 * 2.Create Map<node, id> for every node in DOM
 * 3.Add / Remove recorderId
 **/
class DomTreeBuffererClass implements DomTreeBufferer {
  public map: Map<
    HTMLElement | Element | Node | EventTarget,
    number
  > = new Map()
  public domSnapshot: string
  public inited: boolean = false
  private id: number = 0 // self-increase id

  constructor() {}

  public takeSnapshotForPageDocument() {
    const action = () => {
      console.time('[Document snapshot]')

      // Buffer every element into the Map
      // Note that textNodes wouldn't been included !!
      Array.prototype.slice.call(document.all).forEach(this.buffer)

      this.domSnapshot = document.documentElement.outerHTML

      // remove id from node
      Array.prototype.slice.call(document.all).forEach((node: HTMLElement) => {
        this.unmark(node)
      })

      this.inited = true

      console.timeEnd('[Document snapshot]')
    }

    if (['complete', 'interactive'].indexOf(document.readyState) !== -1) {
      action()
    } else {
      document.addEventListener('DOMContentLoaded', action)
    }
  }

  private newId(): number {
    this.id += 1
    return this.id
  }

  // mark recorderId on non-textnode
  public mark(ele: ElementX, id): void {
    ele.setAttribute(ID_KEY, id)
  }

  // remove recorderId on non-textnode
  public unmark(ele: ElementX, isDeep: boolean = false): void {
    const { removeAttribute } = ele
    removeAttribute && ele.removeAttribute(ID_KEY)

    if (isDeep && ele.childElementCount) {
      Array.prototype.slice
        .call(ele.children)
        .forEach(chEle => this.unmark(chEle))
    }
  }

  private buffer = (ele: ElementX): number => {
    let recorderId = this.map.get(ele) || this.newId()
    this.map.set(ele, recorderId)

    this.mark(ele, recorderId)

    return recorderId
  }

  // if document have new node, use this method because that node may have childElement
  public bufferNewElement = (ele: ElementX): void => {
    this.buffer(ele)

    if (ele.childElementCount) {
      // element.children retun childElements without textNodes
      Array.prototype.slice
        .call(ele.children)
        .forEach(chEle => this.bufferNewElement(chEle))
    }
  }

  // get recorderId from map by element
  public getRecordIdByElement = (
    ele: ElementX | EventTarget
  ): number | undefined => {
    return this.map.get(ele)
  }
}

const documentBufferer = new DomTreeBuffererClass()

export default documentBufferer
