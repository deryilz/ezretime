export default class Split {
  constructor() {
    this.start = 0;
    this.end = 0;
  }

  get duration() {
    if (this.end === 0 || this.start >= this.end) {
      return NaN;
    } else {
      return this.end - this.start;
    }
  }
}
