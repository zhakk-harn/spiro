export class InterpolableValue {
  constructor(timingFn, from, to) {
    this.timingFn = timingFn;
    this.from = from;
    this.to = to;
  }

  get value() {
    return this.timingFn();
  }
}

function map(value, fromMin, fromMax, toMin, toMax) {
  return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}
