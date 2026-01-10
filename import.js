var wsd_sr_database = JSON.parse(localStorage.getItem("WSD_SR_PLUS") || "{}")

const STYLE_RED = "--button-bg:var(--mantine-color-red-light);--button-hover:var(--mantine-color-red-light-hover);--button-color:var(--mantine-color-red-light-color);--button-bd:calc(0.0625rem * var(--mantine-scale)) solid transparent;padding-inline:var(--mantine-spacing-xs)" 
const STYLE_GREEN = "--button-bg:var(--mantine-color-green-light);--button-hover:var(--mantine-color-green-light-hover);--button-color:var(--mantine-color-green-light-color);--button-bd:calc(0.0625rem * var(--mantine-scale)) solid transparent;padding-inline:var(--mantine-spacing-xs)" 
const STYLE_ORANGE = "--button-bg:var(--mantine-color-orange-light);--button-hover:var(--mantine-color-orange-light-hover);--button-color:var(--mantine-color-orange-light-color);--button-bd:calc(0.0625rem * var(--mantine-scale)) solid transparent;padding-inline:var(--mantine-spacing-xs)" 
const now = new Date()
var LAST_7D_RESET = new Date();
LAST_7D_RESET.setUTCDate(LAST_7D_RESET.getUTCDate() -  ((LAST_7D_RESET.getUTCDay() + 4) % 7))
LAST_7D_RESET.setUTCHours(4)


var setup  = async () => {
  // Wait for the update button to exist
  const update_button = document.querySelector("#reservations-table > div:nth-child(1) > div:nth-child(3) > button:nth-child(2) > span:nth-child(1) > span:nth-child(1)")
  if (update_button == undefined) { setTimeout(setup, 100)
    return
  }

  const SHEET_ID = window.location.href.split("/").pop()
  var sr_data = await (await fetch(`https://raidres.top/api/events/${SHEET_ID}`)).json()
  const RAID_ID = sr_data.raidId
  const item_names = {}
  const item_ids = {}
  const item_data = await (await fetch(`https://raidres.top/raids/raid_${RAID_ID}.json`)).json();
  for (const item of item_data.raidItems) {
    item_names[item.id] = item.name
    item_ids[item.name] = item.id
  }

  const plus_hundreds = {}
  for (const entry of Object.values(wsd_sr_database.entries)) {
    if (Object.values(item_names).includes(entry.item) && entry.plus >= 100) {
      const player_name = entry.player.toLowerCase();
      plus_hundreds[player_name] = [...(plus_hundreds[player_name] || []), entry.item]
    }
  }

  // Inject WSD button
  const header_container = document.querySelector(".mantine-visible-from-xs")
  header_container.innerHTML += `<a id="wsd-import" style=${STYLE_GREEN} class="mantine-focus-auto mantine-active BaseLayout_button__ZTaOC m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root" data-variant="light"><span class="m_80f1301b mantine-Button-inner"><span class="m_811560b9 mantine-Button-label" id="wsd-import-text">WSD SR+ ( No database, click to import )</span></span></a>`
  const wsd_button = document.getElementById("wsd-import")
  const wsd_button_text = document.getElementById("wsd-import-text")

  // Update SR's at interval ( if we have a database )
  async function updateSRs(onlyOnce) {
    if (!onlyOnce) { setTimeout(updateSRs, 120000) } // every 2 minutes
    if (!wsd_sr_database.time) { wsd_button.style = STYLE_RED; return }

    // Database is outdated if it's from previous reset
    if (wsd_sr_database.time < LAST_7D_RESET.getTime()) {
      wsd_button_text.innerText = `WSD SR+ ( database is outdated, click to import )`
      wsd_button.style = STYLE_RED;
      return
    }
    wsd_button_text.innerText = `WSD SR+ ( database is up-to-date )`

    var sr_data = await (await fetch(`https://raidres.top/api/events/${SHEET_ID}`)).json()
    const hours_since_raid_start = (new Date() - new Date(sr_data.startTime)) / 1000 / 60 / 60
    if (hours_since_raid_start > 1) {
      wsd_button.style = STYLE_ORANGE;
      return
    }
    wsd_button.style = STYLE_GREEN

    var srs_added = false
    // create plus hundreds
    var player_srs = {}
    for (const res of sr_data.reservations) {
      const player_name = res.character.name.toLowerCase()
      player_srs[player_name] = { items: [...(player_srs[player_name]?.items || []), item_names[res.raidItemId]], res }
    }
    for (const name of Object.keys(player_srs)) {
      const missing = (new Set(plus_hundreds[name]).difference(new Set(player_srs[name].items))).values()
      for (const item_name of missing) {
        const item_id = item_ids[item_name]
        console.log(item_name)
        console.log(item_id)
        const res = player_srs[name].res
        const r = await fetch("https://raidres.top/api/raid-event-reservations", {
          method: "POST",
          body: JSON.stringify({
            "reference": SHEET_ID,
            "characterName": res.character.name,
            "characterClass": res.character.class,
            "specialization": res.character.specialization,
            "raidItemIds": [ item_id ],
            "comment": "indirect",
            "isTemporary": false,
            "srPlus": []
          })
        })
        if (r.ok) { srs_added = true }
      }
    }

    // If we added new sr's, refetch
    if (srs_added) {
      sr_data = await (await fetch(`https://raidres.top/api/events/${SHEET_ID}`)).json()
    }

    // update sr plus
    var updates = []
    for (const res of sr_data.reservations) {
      if (!res.srPlus) { continue }
      const item_name = item_names[res.raidItemId]
      const player_name = res.character.name.toLowerCase()
      const wsd_sr = wsd_sr_database.entries[`${player_name}@${item_name}`]
      if (wsd_sr && (res.srPlus.value !== wsd_sr.plus || !res.srPlus.isValid)) {
          updates.push({"reservationId": res.id, "isValid": true, "value": wsd_sr.plus})
      } else if (!wsd_sr && (res.srPlus.value !== 0 || !res.srPlus.isValid)) {
        updates.push({"reservationId": res.id, "isValid": true, "value": 0})
      }
    }

    if (updates.length > 0) {
      fetch(`https://raidres.top/api/events/${SHEET_ID}/sr-plus`, {
        "method": "PUT",
        "Origin": "https://raidres.fly.dev",
        "body": JSON.stringify({"reference": SHEET_ID, "reservations": updates})
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
        const player_name = entry.player.toLowerCase()
        entry_map[`${player_name}@${entry.item}`] = entry
      }
      wsd_sr_database = { entries: entry_map, time: new Date().getTime() }
      localStorage.setItem("WSD_SR_PLUS", JSON.stringify(wsd_sr_database))
      // Update SRs instantly, run only once
      updateSRs(true)
  }
  // Start SR update loop
  updateSRs()
}

setup();
