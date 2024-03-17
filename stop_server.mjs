"use strict";

import net from "node:net";
import {
  EC2Client,
  DescribeInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";

const instanceSelector = { InstanceIds: [process.env.EC2_ID] };
const ec2 = new EC2Client({ region: "ap-southeast-2" });

// https://developer.valvesoftware.com/wiki/Source_RCON_Protocol#Node.js
const readResponse = (buffer) => {
  return {
    size: buffer.readInt32LE(0),
    id: buffer.readInt32LE(4),
    type: buffer.readInt32LE(8),
    body: buffer.toString("ascii", 12, buffer.length - 2),
  };
};

const createRequest = (type, id, body) => {
  let size = Buffer.byteLength(body) + 14;
  let buffer = Buffer.alloc(size);
  buffer.writeInt32LE(size - 4, 0);
  buffer.writeInt32LE(id, 4);
  buffer.writeInt32LE(type, 8);
  buffer.write(body, 12, size - 2, "ascii");
  buffer.writeInt16LE(0, size - 2);
  return buffer;
};

const sendRequest = async (client, request) =>
  new Promise((resolve, reject) => {
    client.on("data", (data) => {
      const response = readResponse(data);
      resolve([client, response]);
    });

    client.on("error", (err) => {
      reject(err);
    });

    client.write(request);
  });

const getInstanceInfo = async () => {
  const descCmd = new DescribeInstancesCommand(instanceSelector);
  const res = await ec2.send(descCmd);
  return res.Reservations[0].Instances[0];
};

const serverIsEmpty = async (address, port, password) => {
  let client = net.connect(port, address);
  let response = undefined;
  const authRequest = createRequest(3, 1, password);
  [client, response] = await sendRequest(client, authRequest);
  if (response.id < 0) throw Error("Could not Authenticate");

  const playerCountRequest = createRequest(2, 2, "/p c");
  [client, response] = await sendRequest(client, playerCountRequest);

  client.end();

  return response.body.includes("Players(0)");
};

const stopServer = async () => {
  const stopCmd = new StopInstancesCommand(instanceSelector);
  await ec2.send(stopCmd);
};

export const handler = async () => {
  try {
    // if server is not running then do nothing
    const instance = await getInstanceInfo();
    if (instance.State.Name !== "running") {
      console.log("Server is not running");
      return;
    }

    const address = instance.PublicIpAddress;
    const port = process.env.RCON_PORT;
    const password = process.env.RCON_PASSWORD;

    // if server has players do nothing
    if (!(await serverIsEmpty(address, port, password))) {
      console.log("Server is not empty");
      return;
    }

    console.log("Server is empty, attempting to stop the instance");
    await stopServer();
  } catch (err) {
    console.error(err);
    console.error("An error occured, stopping the server");
    // try to stop the server in the even of an error
    await stopServer();
  }
};
