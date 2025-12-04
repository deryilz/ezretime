export default class VideoCalculator {
  constructor(videoElement) {
    this.MAX_SAMPLE_SIZE = 60;
    this.DEFAULT_FPS = 60;

    this.videoElement = videoElement;
    this.videoElement.playbackRate = 1;

    this.fpsSamples = [];
    this.listeners = [];

    this.listenForSeek();
    this.requestTicker();
  }

  get fps() {
    return Math.round(1 / this.fpsSampleAverage) || this.DEFAULT_FPS;
  }

  get fpsSampleAverage() {
    let totalSecs = this.fpsSamples.reduce((a, b) => a + b, 0);
    let totalFrames = this.fpsSamples.length;

    return totalSecs / totalFrames || 0;
  }

  get fpsCalculatedYet() {
    return this.fpsSamples.length >= this.MAX_SAMPLE_SIZE;
  }

  listenForSeek() {
    this.videoElement.addEventListener("seeked", this.onSeek.bind(this));
  }

  onSeek() {
    if (this.fpsCalculatedYet) return;

    this.fpsSamples.pop();
    this.disregardNextTick = true;
    // remove last and next sample because seeking messes stuff up
  }

  requestTicker() {
    this.videoElement.requestVideoFrameCallback(this.onTick.bind(this));
  }

  onTick(_, tickData) {
    let { presentedFrames: totalFrames, mediaTime: videoTime } = tickData;

    let videoTimeDiff = Math.abs(videoTime - this.lastVideoTime);
    this.lastVideoTime = videoTime;

    let frameCountDiff = Math.abs(totalFrames - this.lastTotalFrames);
    this.lastTotalFrames = totalFrames;

    let sample = videoTimeDiff / frameCountDiff;

    if (this.disregardNextTick) {
      this.disregardNextTick = false;
    } else if (
      !isNaN(sample) &&
      !this.fpsCalculatedYet &&
      this.isSampleCloseToAverage(sample) &&
      this.videoElement.playbackRate === 1 &&
      document.hasFocus()
    ) {
      this.fpsSamples.push(sample);
      this.listeners.forEach(f => f());
    } else if (this.fpsSamples.length < 5) {
      this.fpsSamples = []
      console.log("Couldn't push frame to VideoCalculator, so resetting:", this)
    }

    this.requestTicker();
  }

  isSampleCloseToAverage(sample) {
    let sampleAverage = this.fpsSampleAverage;
    if (sampleAverage) {
      let diffFromAverage = Math.abs(sampleAverage - sample);
      return diffFromAverage < sampleAverage * 0.2;
    } else {
      return true;
    }
  }

  estimateFrame(seconds) {
    return Math.round(seconds * this.fps);
  }

  // convert .666 to .667 and so on, since we only have 0.01 accuracy on the video
  roundToFrame(seconds) {
    let frame = this.estimateFrame(seconds);
    return frame / this.fps;
  }

  formatSecs(seconds) {
    return (
      (seconds - (seconds %= 60)) / 60 +
      (seconds < 10 ? ":0" : ":") +
      seconds.toFixed(3)
    );
  }

  getRoundedTime() {
    return this.roundToFrame(this.videoElement.currentTime);
  }
}
