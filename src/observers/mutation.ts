import {
  ObserverClass,
  window,
  DOMRecord,
  DOMRecordTypes,
  MutationRecordX,
  NodeX
} from 'models'
import { ID_KEY } from 'constants'
import FridayDocument from 'tools/document'
import { _log } from 'tools/helpers'

const { getFridayIdByNode } = FridayDocument

/** Observe DOM change such as DOM-add/remove text-change attribute-change */
export default class DOMMutationObserver implements ObserverClass {
  public name: string = 'DOMMutationObserver'
  private observer: MutationObserver

  constructor(public whenMutationBeenObserved) {
    this.install()
  }

  private process(mutationRecord: MutationRecordX) {
    const { target, attributeName } = mutationRecord

    // ignore script tag's mutation
    if (target && target.tagName === 'SCRIPT') return

    switch (mutationRecord.type) {
      case 'attributes': {
        // friday id change ignore
        if (attributeName !== ID_KEY) return

        return this.getAttrReocrd(mutationRecord)
      }

      case 'characterData': {
        return this.getTextRecord(mutationRecord)
      }

      case 'childList': {
        return this.getNodesRecord(mutationRecord)
      }

      default: {
        return
      }
    }
  }

  // when node's attribute change
  private getAttrReocrd({ attributeName, target }: MutationRecordX): DOMRecord {
    let record = { attr: {} } as DOMRecord
    record.target = getFridayIdByNode(target)

    record.type = DOMRecordTypes.attr
    record.attr.k = attributeName
    record.attr.v = target.getAttribute(attributeName)

    return record
  }

  // when textNode's innerText change
  private getTextRecord({ target }: MutationRecordX): DOMRecord {
    let record = {} as DOMRecord
    record.target = getFridayIdByNode(target)

    record.type = DOMRecordTypes.text
    // use testConent instend of innerText(non-standard),
    // see alse https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext
    record.text = target.textContent

    return record
  }

  /**
   * @Tip:
   * invoke when node/textNode added or removed,
   * @Or:
   * if a contenteditable textNode's text been all removed, type should be `childList`(remove #text),
   * later if you type/add some text in this empty textNode, the first mutation's type would be `childList`(add #text), fellows by `characterData`s
   **/
  private getNodesRecord({
    target,
    addedNodes,
    removedNodes,
    previousSibling,
    nextSibling
  }: MutationRecordX): DOMRecord {
    let record = {} as DOMRecord
    record.target = getFridayIdByNode(target)

    if (previousSibling) {
      record.prev = getFridayIdByNode(previousSibling)
    }

    if (nextSibling) {
      record.next = getFridayIdByNode(nextSibling)
    }

    /** ------------------------------ Add or Remove nodes --------------------------------- */
    const { length: isAdd } = addedNodes
    const { length: isRemove } = removedNodes

    if (isAdd || isRemove) {
      // addnodes / removenodes could exist both
      record.type = DOMRecordTypes.node

      this.nodesFilter(addedNodes).forEach(node => {
        let nodeData = {} as NodeX
        record.add = []

        switch (node.nodeName) {
          case '#text': {
            // nodeValue see https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
            nodeData.html = target.nodeValue
            record.add.push(nodeData)
            return
          }

          default: {
            const { parentElement } = node

            // in case the node isn't the <html> element
            if (parentElement) {
              nodeData.index = this.getNodeIndex(parentElement, node)
              FridayDocument.storeNewNode({
                node,
                beforeUnmark: () => {
                  _log(this)
                  nodeData.html = node.outerHTML
                }
              })
            }
            // TODO: find out what purpose of the code below
            if (nodeData.index === -1) {
              nodeData.html = node.nodeValue
            }
          }
        }
      })
    }

    return record
  }

  // filter out comment and script
  private nodesFilter(nodeList: NodeList): HTMLElement[] {
    return Array.from(nodeList).filter(node => {
      const { nodeName, tagName } = node as HTMLElement
      return nodeName !== '#comment' && tagName !== 'SCRIPT'
    }) as HTMLElement[]
  }

  // get index of the node, attention that .childNodes return textNodes also
  private getNodeIndex(parentElement: HTMLElement, node: ChildNode) {
    return Array.from(parentElement.childNodes).indexOf(node)
  }

  install() {
    const MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver

    this.observer = new MutationObserver((records: MutationRecord[]) => {
      const { whenMutationBeenObserved } = this

      for (let record of records) {
        const DOMRecord = this.process(record as MutationRecordX)

        if (DOMRecord && whenMutationBeenObserved) {
          whenMutationBeenObserved(DOMRecord)
        }
      }
    })

    this.observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    })
  }

  uninstall() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}
