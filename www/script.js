const SERVER_POLL_INTERVAL_MS = 5000;

const SERVER_STATUS_URL =
  "https://hoyuhwgv9l.execute-api.ap-southeast-2.amazonaws.com/status";

let intervalId;

window.onload = async () => {
  try {
    const runningStatus = await startServer();
    console.log(runningStatus);
  } catch (err) {
    console.error(err);
    document.getElementById("error-area").innerText =
      "Something went wrong, try refreshing the page. If that doesn't work talk to George. Error is:" +
      JSON.stringify(err);
  }
};

async function startServer() {
  console.log("starting server");
  return new Promise((resolve, reject) => {
    intervalId = setInterval(
      () =>
        fetchSeverStatus()
          .then((status) => {
            console.log("fetched status: ", status);
            document.getElementById("server-status").innerText = status.State;
            document.getElementById("server-ip").innerText =
              status.PublicIpAddress ?? "Not assigned yet.";

            if (status.State === "running") {
              console.log("server state is running, resolving");
              clearInterval(intervalId);
              resolve(status);
            }
          })
          .catch((err) => {
            clearInterval(intervalId);
            reject(err);
          }),
      SERVER_POLL_INTERVAL_MS,
    );
  });
}

async function fetchSeverStatus() {
  const res = await fetch(SERVER_STATUS_URL);

  if (!res.ok) {
    throw new Error(`Could not connect to lambda: ${res.status}`);
  }

  const data = await res.json();
  return data;
}
