var setup  = () => {
  console.log("RAN")
  doc = document.querySelector("#reservations-table > div:nth-child(1) > div:nth-child(3)")
  if (doc == undefined) {
    setTimeout(setup, 100)
    return
  }
  doc.innerHTML += '<button style="--button-bg: var(--mantine-color-blue-light); --button-hover: var(--mantine-color-blue-light-hover); --button-color: var(--mantine-color-blue-light-color); --button-bd: calc(0.0625rem * var(--mantine-scale)) solid transparent;" class="mantine-focus-auto mantine-active m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root" data-variant="light" type="button"><span class="m_80f1301b mantine-Button-inner"><span class="m_811560b9 mantine-Button-label" id="wsd-import">Import WSD SR+</span></span></button>'
  doc = document.getElementById("wsd-import")
  doc.onclick = async () => {
    var wsd_sr_plus = JSON.parse(prompt("Input Watership Down SR+ data"))


    var sheet_id = window.location.href.split("/").pop()
    var sr_data = await (await fetch(`https://raidres.top/api/events/${sheet_id}`)).json()
    var raid_id = sr_data.raidId
    var item_data = await (await fetch(`https://raidres.top/raids/raid_${raid_id}.json`)).json();
    var item_name_to_id = (name) => {
      return item_data.raidItems.filter((item) => item.name == name)[0].id
    }
    var updates = []
    for (const res of sr_data.reservations) {
      for (const plus of wsd_sr_plus) {
        item_id = item_name_to_id(plus.item)
        if (plus.attendee == res.character.name && res.raidItemId == item_id) {
          updates.push({"reservationId": res.id, "isValid": true, "value": plus.sr_plus})
        }
      }
    }

    fetch(`https://raidres.top/api/events/${sheet_id}/sr-plus`, {
      "method": "PUT",
      "Origin": "https://raidres.fly.dev",
      "body": JSON.stringify({"reference": sheet_id, "reservations": updates})
    });
  }
}

setup();
