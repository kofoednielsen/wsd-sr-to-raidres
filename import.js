console.log("Content-script loaded")
async function registerScript(message) {
  console.log("Called")
  raid_id = window.location.href.split("/").pop()
  r = await fetch("https://raidres.top/api/events/K27SZ5/sr-plus", {
    "method": "PUT",
    "Origin": "https://raidres.fly.dev",
    "body": "{\"reference\":\"K27SZ5\",\"reservations\":[{\"reservationId\":3660161,\"isValid\":false,\"value\":10}]}"
  });
}
registerScript()

