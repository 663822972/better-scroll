import Base from './Base'
import { TranslaterPoint } from '../translater'
import {
  getNow,
  requestAnimationFrame,
  cancelAnimationFrame,
  EaseFn
} from '../util'
import { Probe } from '../enums/probe'

export default class Animation extends Base {
  scrollTo(
    startPoint: TranslaterPoint,
    endPoint: TranslaterPoint,
    time: number,
    easingFn: EaseFn | string
  ) {
    // time is 0
    if (!time) {
      this.translate(endPoint)
      this.hooks.trigger(this.hooks.eventTypes.move, endPoint)
      // force reflow to put everything in position
      this._reflow = document.body.offsetHeight
      // maybe need reset position
      this.hooks.trigger(this.hooks.eventTypes.end, endPoint)
      return
    }
    this.animate(startPoint, endPoint, time, easingFn as EaseFn)
  }

  private animate(
    startPoint: TranslaterPoint,
    endPoint: TranslaterPoint,
    duration: number,
    easingFn: EaseFn
  ) {
    let startTime = getNow()
    let destTime = startTime + duration

    const step = () => {
      let now = getNow()

      // js animation end
      if (now >= destTime) {
        this.pending = false
        this.translate(endPoint)

        this.hooks.trigger(this.hooks.eventTypes.move, endPoint)

        this.hooks.trigger(this.hooks.eventTypes.end, endPoint)
        return
      }

      now = (now - startTime) / duration
      let easing = easingFn(now)
      const newPoint = {} as { [key: string]: any }
      Object.keys(endPoint).forEach(key => {
        const startValue = startPoint[key]
        const endValue = endPoint[key]
        newPoint[key] = (endValue - startValue) * easing + startValue
      })
      this.translate(<TranslaterPoint>newPoint)

      if (this.pending) {
        this.timer = requestAnimationFrame(step)
      }

      if (this.options.probeType === Probe.Realtime) {
        this.hooks.trigger(this.hooks.eventTypes.move, newPoint)
      }
    }

    this.pending = true
    cancelAnimationFrame(this.timer)
    step()
  }

  stop() {
    // still in requestFrameAnimation
    if (this.pending) {
      this.pending = false
      cancelAnimationFrame(this.timer)
      this.forceStopped = true
      this.hooks.trigger(this.hooks.eventTypes.forceStop)
    }
  }
}