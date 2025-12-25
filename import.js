
console.log("Content-script loaded")
document.querySelector("html").innerHTML += '<button id="wsd-import" suppressHydrationWarning>WSD import</button>'

document.querySelector("#wsd-import").onclick = async () => {
  var wsd_sr_plus = JSON.parse(prompt("Input Watership Down SR+ data"))


  var sr_data = await (await fetch("https://raidres.top/api/events/K27SZ5")).json()
  var updates = []
  for (const res of sr_data.reservations) {
    for (const plus of wsd_sr_plus) {
      if (plus.attendee == res.character.name && res.raidItemId == plus.item_id) {
        updates.push({"reservationId": res.id, "isValid": true, "value": plus.sr_plus})
      }
    }
  }

  console.log("Called")
  raid_id = window.location.href.split("/").pop()
  fetch("https://raidres.top/api/events/K27SZ5/sr-plus", {
    "method": "PUT",
    "Origin": "https://raidres.fly.dev",
    "body": JSON.stringify({"reference": raid_id, "reservations": updates})
  });
}
