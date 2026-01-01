var wsd_sr_database = JSON.parse(localStorage.getItem("WSD_SR_PLUS") || "{}")

var setup  = () => {
  console.log("setup ran")
  // Wait for the update button to exist
  const update_button = document.querySelector("#reservations-table > div:nth-child(1) > div:nth-child(3) > button:nth-child(2) > span:nth-child(1) > span:nth-child(1)")
  if (update_button == undefined) { setTimeout(setup, 100)
    return
  }
  // Inject WSD button
  const header_container = document.querySelector(".mantine-visible-from-xs")
  header_container.innerHTML += `<a id="wsd-import" style="--button-bg:var(--mantine-color-cyan-light);--button-hover:var(--mantine-color-cyan-light-hover);--button-color:var(--mantine-color-cyan-light-color);--button-bd:calc(0.0625rem * var(--mantine-scale)) solid transparent;padding-inline:var(--mantine-spacing-xs)" class="mantine-focus-auto mantine-active BaseLayout_button__ZTaOC m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root" data-variant="light"><span class="m_80f1301b mantine-Button-inner"><span class="m_811560b9 mantine-Button-label" id="wsd-import-text"></span></span></a>`
  const wsd_button = document.getElementById("wsd-import")
  const wsd_button_text = document.getElementById("wsd-import-text")

  // Update SR's at invterval ( if we have a database )
  async function updateSRs(onlyOnce) {
    console.log("interval ran")
    if (!onlyOnce) { setTimeout(updateSRs, 10000) }
    if (!wsd_sr_database) { return }
    const minutes = Math.floor((new Date().getTime() - wsd_sr_database.time)/1000/60)
    wsd_button_text.innerText = `WSD SR+ ( DB ${minutes} minutes old )`

    var sheet_id = window.location.href.split("/").pop()
    var sr_data = await (await fetch(`https://raidres.top/api/events/${sheet_id}`)).json()
    var raid_id = sr_data.raidId
    var item_data = await (await fetch(`https://raidres.top/raids/raid_${raid_id}.json`)).json();
    var item_id_to_name = (id) => {
      return item_data.raidItems.filter((item) => item.id == id)[0]?.name
    }
    var updates = []
    for (const res of sr_data.reservations) {
      const item_name = item_id_to_name(res.raidItemId)
      const wsd_sr = wsd_sr_database.entries[`${res.character.name}@${item_name}`]
      if (wsd_sr && (res.srPlus.value !== wsd_sr.plus || !res.srPlus.isValid)) {
          updates.push({"reservationId": res.id, "isValid": true, "value": wsd_sr.plus})
      } else if (!wsd_sr && (res.srPlus.value !== 0 || !res.srPlus.isValid)) {
        updates.push({"reservationId": res.id, "isValid": true, "value": 0})
      }
    }

    if (updates.length > 0) {
      fetch(`https://raidres.top/api/events/${sheet_id}/sr-plus`, {
        "method": "PUT",
        "Origin": "https://raidres.fly.dev",
        "body": JSON.stringify({"reference": sheet_id, "reservations": updates})
      });
    }
  }

  // Let user upload a new databaes
  wsd_button.onclick = async () => {
      const encoded = prompt("Input Watership Down SR+ database export")
      const blob = new Blob([Uint8Array.from(atob(encoded), c => c.charCodeAt(0))]) 
      const entries = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).json()
      var entry_map = {}
      for (const entry of entries) {
        entry_map[`${entry.player}@${entry.item}`] = entry
      }
      wsd_sr_database = { entries: entry_map, time: new Date().getTime() }
      localStorage.setItem("WSD_SR_PLUS", JSON.stringify(wsd_sr_database))
      // Update SRs instantly, run only once
      updateSRs(true)
  }
  // Update database button
  // Start SR update loop
  updateSRs()
}

setup();
