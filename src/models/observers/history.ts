import { Record } from '.'

export enum HistoryTypes {
  history = 'history'
}
export interface HistoryRecord extends Record {
  type: HistoryTypes
  from: string // beacon record has no id
  to: string
}
