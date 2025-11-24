import DraggablePopup from "./draggable-popup.js";
import ParsedURL from "./parsed-url.js";
import Split from "./split.js";
import Strings from "./strings.js";
import VideoCalculator from "./video-calculator.js";

export default class EzRetime {
  constructor() {
    if (window.ezRetime) {
      console.log("ezRetime is already active.");
      return;
    }
    window.ezRetime = true;

    this.TURBO_SPEEDUP = 5;
    this.originalUrl = ParsedURL.fromCurrent();
    this.createPrototype();

    // for the extension, the window is closable
    this.popup = new DraggablePopup("ezRetime", true);
    this.popup.closeListeners.push(() => window.ezRetime = false);

    this.window = this.popup.contentElement;
    this.checkBrowser();
    this.checkSpeedrunCom();
    this.video = this.getVideo();
    this.videoCalc = new VideoCalculator(this.video);
    this.listenForChange();
    this.findFps().then(() => {
      this.splits = [new Split()];
      this.currentSplitIndex = 0;
      this.addElements();
      this.render();
      this.listenForInput();
    });
  }

  $(id) {
    return this.window.querySelector("#" + id);
  }

  createPrototype() {
    HTMLElement.prototype.addElement = function (
      elementName,
      elementProperties
    ) {
      let newElement = document.createElement(elementName);
      Object.assign(newElement, elementProperties);
      this.appendChild(newElement);
      return newElement;
    };
  }

  checkBrowser() {
    if (!HTMLVideoElement.prototype.requestVideoFrameCallback) {
      this.window.addElement("div", {
        className: "small error",
        innerHTML: Strings.INVALID_BROWSER,
      });

      throw new Error(Strings.INVALID_BROWSER);
    }
  }

  checkSpeedrunCom() {
    let currentUrl = ParsedURL.fromCurrent();
    if (currentUrl.domain === "speedrun.com") {
      this.window.addElement("div", {
        className: "small error",
        innerHTML: Strings.SPEEDRUN_COM,
      });

      let iframeElement = document.querySelector("iframe.aspect-video");
      if (iframeElement) {
        let parsedIframeSrc = new ParsedURL(iframeElement.src);
        let redirectUrl = parsedIframeSrc.toNonEmbedUrl();

        this.window.addElement("a", {
          className: "small button",
          innerHTML: Strings.GO_TO_RUN,
          href: redirectUrl,
        });
      }

      throw new Error(Strings.SPEEDRUN_COM);
    }
  }

  getVideo() {
    let videoElement = document.querySelector("video");
    if (!videoElement) {
      this.window.addElement("div", {
        className: "error",
        innerHTML: Strings.NO_VIDEO,
      });
      throw new Error(Strings.NO_VIDEO);
    }
    return videoElement;
  }

  findFps() {
    return new Promise((resolve, reject) => {
      let fpsDetermine = this.window.addElement("div");

      fpsDetermine.addElement("div", {
        innerHTML: Strings.FINDING_FPS,
      });

      fpsDetermine.addElement("progress", {
        max: this.videoCalc.MAX_SAMPLE_SIZE,
        value: 0,
        id: "progress",
      });

      fpsDetermine.addElement("div", {
        className: "small",
        innerHTML: Strings.FINDING_FPS_2,
      });

      this.videoCalc.listeners.push(() => {
        this.$("progress").value = this.videoCalc.fpsSamples.length;

        if (this.videoCalc.fpsCalculatedYet) {
          resolve();
        }
      });
    });
  }

  addElements() {
    this.popup.clear();

    this.window.addElement("div", {
      innerHTML: "Ready to retime!",
    });

    this.window.addElement("a", {
      className: "small",
      innerHTML: "Need help?",
      onclick: this.openHelp.bind(this),
    });

    this.window.addElement("hr");

    this.window.addElement("div", {
      className: "small",
      innerHTML: Strings.FOUND_FPS(this.videoCalc.fps),
    });

    let splitRow = this.window.addElement("div", {
      className: "row",
    });

    splitRow.addElement("a", {
      className: "small",
      innerHTML: "<--",
      id: "prev",
      onclick: this.prevSplit.bind(this),
    });

    splitRow.addElement("span", {
      className: "small bold",
      id: "current",
    });

    splitRow.addElement("a", {
      className: "small",
      innerHTML: "-->",
      id: "next",
      onclick: this.nextSplit.bind(this),
    });

    splitRow.addElement("a", {
      className: "small",
      innerHTML: "New",
      id: "add",
      onclick: this.addSplit.bind(this),
    });

    splitRow.addElement("a", {
      className: "small",
      innerHTML: "Delete",
      id: "delete",
      onclick: this.deleteSplit.bind(this),
    });

    this.window.addElement("div", {
      className: "small",
      id: "start",
    });

    this.window.addElement("div", {
      className: "small",
      id: "end",
    });

    this.window
      .addElement("div", {
        className: "small",
        innerHTML: "Extra time:",
      })
      .addElement("input", {
        value: "0",
        id: "input",
      });

    this.window.addElement("div", {
      className: "small",
      id: "retime",
    });

    this.window.addElement("div").addElement("a", {
      className: "small button",
      innerHTML: Strings.COPY,
      onclick: this.copyModNote.bind(this),
      id: "copy",
    });
  }

  seekFrame(frameOffset) {
    this.videoCalc.requestTicker(); // good time to recalibrate

    // youtube already has functionality for this
    if (this.originalUrl.domainName !== "YOUTUBE") {
      this.video.currentTime += frameOffset / this.videoCalc.fps;
      this.setTurboMode(false);
    }
  }

  toggleTurboMode() {
    let isTurboMode = this.video.playbackRate === this.TURBO_SPEEDUP;
    this.setTurboMode(!isTurboMode);

    if (!isTurboMode && this.originalUrl.domainName === "TWITCH") {
      setTimeout(() => this.setTurboMode(true), 100);
      // on twitch, we need to do it again. weird hack
    }
  }

  setTurboMode(bool) {
    this.video.playbackRate = bool ? this.TURBO_SPEEDUP : 1;
  }

  listenForInput() {
    window.addEventListener("keydown", this.onGlobalKey.bind(this));
    this.$("input").addEventListener("keyup", this.onInputKey.bind(this));
  }

  onGlobalKey(event) {
    let pressedCtrl = event.ctrlKey || event.altKey;

    switch (event.key) {
      case ",":
        if (pressedCtrl) {
          this.setStartTime();
        } else {
          this.seekFrame(-1);
        }
        break;
      case ".":
        if (pressedCtrl) {
          this.setEndTime();
        } else {
          this.seekFrame(1);
        }
        break;
      case "/":
        if (pressedCtrl) {
          this.addSplit();
        }
        break;
      case "s":
        this.toggleTurboMode();
        break;
    }
  }

  onInputKey(event) {
    if (event.key === "Enter") {
      document.activeElement.blur();
    }

    let input = this.$("input");
    let parsed = Number(input.value);
    if (isNaN(parsed)) {
      input.value = "0";
    }
    this.render();
  }

  get currentSplit() {
    return this.splits[this.currentSplitIndex];
  }

  get extraTime() {
    return Number(this.$("input").value) || 0;
  }

  setStartTime() {
    this.currentSplit.start = this.videoCalc.getRoundedTime();
    this.render();
  }

  setEndTime() {
    this.currentSplit.end = this.videoCalc.getRoundedTime();
    this.render();
  }

  calcRetime() {
    let retime = 0;
    let lastEnd = 0;

    for (let i = 0; i < this.splits.length; i++) {
      let duration = this.splits[i].duration;
      if (this.splits[i].start < lastEnd) {
        return {
          success: false,
          message: Strings.OUT_OF_ORDER(i + 1),
        };
      } else if (isNaN(duration)) {
        return {
          success: false,
          message: Strings.BAD_SPLIT(i + 1),
        };
      }
      lastEnd = this.splits[i].end;
      retime += duration;
    }

    let igt = this.videoCalc.roundToFrame(retime);
    let rta = this.videoCalc.roundToFrame(
      this.splits[this.splits.length - 1].end - this.splits[0].start
    );

    return {
      success: true,
      igt: igt + this.extraTime,
      rta: rta,
    };
  }

  render() {
    console.log("ezRetime render:", this);

    this.$("current").innerHTML = Strings.CURRENT_SPLIT(
      this.currentSplitIndex + 1,
      this.splits.length
    );

    this.$("prev").classList.toggle("disabled", this.currentSplitIndex === 0);

    this.$("delete").classList.toggle("disabled", this.splits.length <= 1);

    this.$("next").classList.toggle(
      "disabled",
      this.currentSplitIndex === this.splits.length - 1
    );

    this.$("start").innerHTML = Strings.START_TIME(
      this.videoCalc.formatSecs(this.currentSplit.start)
    );

    this.$("end").innerHTML = Strings.END_TIME(
      this.videoCalc.formatSecs(this.currentSplit.end)
    );

    let retime = this.calcRetime();
    let message;
    if (retime.success) {
      message = this.videoCalc.formatSecs(retime.igt);
    } else {
      message = retime.message;
    }

    this.$("retime").innerHTML = Strings.RETIME(message);
    this.$("copy").style.display = retime.success ? "inline-block" : "none";
  }

  addSplit() {
    // insert after current index
    this.currentSplitIndex++;
    this.splits.splice(this.currentSplitIndex, 0, new Split());
    this.render();
  }

  deleteSplit() {
    if (this.splits.length <= 1) return;

    this.splits.splice(this.currentSplitIndex, 1);
    this.currentSplitIndex = Math.min(
      this.currentSplitIndex,
      this.splits.length - 1
    );
    this.render();
  }

  prevSplit() {
    this.currentSplitIndex--;
    this.render();
  }

  nextSplit() {
    this.currentSplitIndex++;
    this.render();
  }

  copyModNote() {
    let details = [];

    for (let i = 0; i < this.splits.length; i++) {
      let n = i === 0 ? "" : ` #${i + 1}`;
      let split = this.splits[i];
      let duration = split.duration;
      let start = this.videoCalc.estimateFrame(split.start);
      let end = this.videoCalc.estimateFrame(split.end);
      details.push(`Start Frame${n}: ${start}, End Frame${n}: ${end}`);
    }

    details.push(`FPS: ${this.videoCalc.fps}`);

    if (this.extraTime !== 0) {
      details.push(`Extra time: ${this.videoCalc.formatSecs(this.extraTime)}`);
    }

    let { igt, rta } = this.calcRetime();

    details.push(`RTA: ${this.videoCalc.formatSecs(rta)}`);

    if (this.splits.length > 1) {
      details.push(`IGT: ${this.videoCalc.formatSecs(igt)}`);
    }

    let modNote = `Mod Note: Retimed (${details.join(", ")})`;
    navigator.clipboard.writeText(modNote).then(() => {
      this.$("copy").style.display = "none";
    });
  }

  openHelp() {
    let helpWindow = new DraggablePopup("ezRetime Help").contentElement;

    helpWindow.addElement("div", {
      innerHTML: "What is this for?",
    });

    helpWindow.addElement("div", {
      className: "small",
      innerHTML: Strings.BASIC_DESC,
    });

    helpWindow.addElement("div", {
      innerHTML: "How do I use this?",
    });

    helpWindow.addElement("div", {
      className: "small",
      innerHTML: Strings.KEY_HELP_1,
    });

    helpWindow.addElement("div", {
      className: "small",
      innerHTML: Strings.KEY_HELP_2,
    });

    helpWindow.addElement("div", {
      className: "small",
      innerHTML: Strings.KEY_HELP_3,
    });

    helpWindow.addElement("a", {
      className: "small button",
      innerHTML: "Visit main page",
      href: "https://www.sprinkzmc.com/ezretime/",
      target: "_blank",
    });
  }

  listenForChange() {
    let changed = false;
    let pushStateCheck = setInterval(() => {
      if (changed) return;
      if (
        location.pathname !== this.originalUrl.pathname ||
        location.search !== this.originalUrl.search
      ) {
        clearInterval(pushStateCheck);
        this.popup.clear();

        this.window.addElement("div", {
          className: "error",
          innerHTML: Strings.VIDEO_CHANGED,
        });

        this.window.addElement("a", {
          className: "button",
          innerHTML: "Restart",
          onclick: () => {
            this.popup.remove();
            new EzRetime();
          },
        });

        changed = true;
      }
    }, 2000);
  }
}
