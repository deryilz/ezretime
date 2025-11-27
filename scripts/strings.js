export default {
  INVALID_BROWSER:
    "ERROR: You are using an invalid browser. Try the latest version of Chrome!",
  SPEEDRUN_COM:
    "You ran the script on speedrun.com, which makes it impossible for\
        ezRetime to access the run video. Try running it on the actual video\
        page (e.g., on YouTube, Twitch, Bilibili.)",
  NO_VIDEO: "No video was found on this page. Terminating...",
  GO_TO_RUN: "Go to the run video",
  FINDING_FPS: "Determining FPS...",
  FINDING_FPS_2: "FPS is automatically being calculated as the video plays.",
  FOUND_FPS: (a) => `Determined FPS: <b>${a}</b>`,
  CURRENT_SPLIT: (a, b) => `Current split: ${a}/${b}`,
  START_TIME: (a) => `Start time: <b>${a}</b>`,
  END_TIME: (a) => `End time: <b>${a}</b>`,
  RETIME: (a) => `Retime: <b>${a}</b>`,
  COPY: "Copy mod message to clipboard",
  OUT_OF_ORDER: (a) =>
    `<b>INVALID</b> (split ${a} is out of order)`,
  BAD_SPLIT: (a) =>
    `<b>INVALID</b> (start time isn't before end time on split ${a})`,
  BASIC_DESC:
    "ezRetime is meant to be a fast and easy way to retime speedruns for\
      verification. It's designed to work on Bilibili, Twitch, and YouTube.",
  KEY_HELP_1:
    "Use the comma <b>( , )</b> and period <b>( . )</b> keys on your\
       keyboard to go forward or backward one frame in the run.",
  KEY_HELP_2:
    "Press ctrl+comma to set the start time of the run. Likewise,\
      ctrl+period sets the end of the run. Once these are both set,\
      the time difference will be shown in the menu and you can copy\
      the mod message to your clipboard.",
  KEY_HELP_3:
    "You can also press the S key to toggle Turbo Mode, which increases the\
      video speed to 5x. And you can add a split with ctrl + /",
  VIDEO_CHANGED:
    "Looks like the video playing has changed.\
      You can press the button below to open a new instance of ezRetime.",
};
