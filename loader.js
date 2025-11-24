// needs to be a dynamic import

import(chrome.runtime.getURL("/scripts/ez-retime.js"))
    .then(mod => new mod.default);
