"use strict";

import { EC2Client, DescribeInstancesCommand, StartInstancesCommand } from "@aws-sdk/client-ec2";

const instanceSelector = {
  InstanceIds: [process.env.EC2_ID],
};

const client = new EC2Client({
  reigon: "ap-southeast-2",
});

const instanceIsStopped = async () => {
  const desc_cmd = new DescribeInstancesCommand(instanceSelector);
  const res = await client.send(desc_cmd);
  const info = res.Reservations[0].Instances[0];

  if (!info) {
    throw new Error(`Could not get instance for id="${process.env.EC2_ID}"`);
  }

  return info.State.Name === "stopped";
};

const startInstance = async () => {
  const start_cmd = new StartInstancesCommand(instanceSelector);
  const res = await client.send(start_cmd);
  return res.StartingInstances.map((i) => i.InstanceId).includes(process.env.EC2_ID) ?? false;
};

export const handler = async () => {
  let started = false;
  try {
    if (await instanceIsStopped()) {
      started = await startInstance();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        started: started,
      }),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: err.httpStatusCode ?? 500,
      body: JSON.stringify({
        error: "An error occured in start-server, check logs for info",
      }),
    };
  }
};
