let VideoDomains = {
  "bilibili.com": "BILIBILI",
  "bilibili.tv": "BILIBILI",
  "twitch.tv": "TWITCH",
  "youtube.com": "YOUTUBE",
};

export default class ParsedURL extends URL {
  constructor(str) {
    super(str);

    this.domain = this.hostname.split(".").slice(-2).join(".");
    // real domain not including subdomains
    // subdomain.example.com -> example.com

    this.domainName = VideoDomains[this.domain] || "UNKNOWN";
  }

  toNonEmbedUrl() {
    switch (this.domainName) {
      /*
        https://player.bilibili.com/player.html?bvid=VIDEOID   
        https://www.bilibili.com/video/VIDEOID
      */
      case "BILIBILI":
        if (
          this.hostname === "player.bilibili.com" &&
          this.pathname === "/player.html" &&
          this.searchParams.has("bvid")
        ) {
          let videoId = this.searchParams.get("bvid");
          return `https://www.bilibili.com/video/${videoId}`;
        }
        break;
      /*
        https://player.twitch.tv/?video=vVIDEOID  
        https://www.twitch.tv/videos/VIDEOID
      */
      case "TWITCH":
        if (
          this.hostname === "player.twitch.tv" &&
          this.pathname === "/" &&
          this.searchParams.has("video") &&
          this.searchParams.get("video").startsWith("v")
        ) {
          let videoId = this.searchParams.get("video").replace("v", "");
          return `https://www.twitch.tv/video/${videoId}`;
        }
        break;
      /*
        https://www.youtube.com/embed/VIDEOID
        https://www.youtube.com/watch?v=VIDEOID
      */
      case "YOUTUBE":
        if (
          this.hostname === "www.youtube.com" &&
          this.pathname.startsWith("/embed") &&
          this.pathname.split("/").length === 3
        ) {
          let videoId = this.pathname.split("/")[2];
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
        break;
    }

    return this.href;
  }

  static fromCurrent() {
    return new ParsedURL(location.href);
  }
}
