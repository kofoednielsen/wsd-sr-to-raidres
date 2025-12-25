'use strict';

function import_action() {
  browser.runtime.sendMessage("import");
}

document.querySelector("#import").addEventListener('click', import_action);
