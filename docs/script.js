const SERVER_POLL_INTERVAL_MS = 5000;

const SERVER_STATUS_URL = "https://hoyuhwgv9l.execute-api.ap-southeast-2.amazonaws.com/status";

const SERVER_START_URL = "https://hoyuhwgv9l.execute-api.ap-southeast-2.amazonaws.com/start";

window.onload = async () => {
  document.getElementById("start-instance-button").onclick = startInstance;

  await checkServerStatus();
  setTimeout(checkServerStatus, SERVER_POLL_INTERVAL_MS);
};

async function checkServerStatus() {
  console.log("checking status");
  const res = await fetch(SERVER_STATUS_URL);

  if (!res.ok) {
    handleError(`Could not connect to check-server lambda: ${res.status}`);
    return false;
  }

  const data = await res.json();
  console.log(`got response: ${data}`);

  if (data.statusCode !== 200) {
    handleError(data.error);
    return false;
  }

  document.getElementById("server-status").innerText = data.State;
  document.getElementById("server-ip").innerText = data.PublicIpAddress ?? "Not assigned yet.";
  document.getElementById("start-instance-area").hidden = data.State === "stopped";

  return true;
}

async function startInstance() {
  console.log("starting server");

  try {
    const res = await fetch(SERVER_START_URL);

    if (!res.ok) {
      handleError(`Could not connect to start-server lambda: ${res.status}`);
      return false;
    }

    const data = await res.json();
    console.log("start-server response is " + data);

    if (data.started) {
      document.getElementById("start-instance-area").hidden = true;
    }

    return true;
  } catch (err) {
    handleError(err);
    return false;
  }
}

function handleError(msg) {
  console.error(msg);
  document.getElementById("error-area").innerText =
    "Something went wrong, try refreshing the page. If that doesn't work talk to George. Error is:" + msg;
}
