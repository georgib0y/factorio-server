"use strict";

import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
} from "@aws-sdk/client-ec2";

const instanceSelector = { InstanceIds: [process.env.EC2_ID] };

const client = new EC2Client({
  reigon: "ap-southeast-2",
});

const describeInstance = async () => {
  const desc_cmd = new DescribeInstancesCommand(instanceSelector);
  const res = await client.send(desc_cmd);
  const info = res.Reservations[0].Instances[0];

  return {
    State: info.State.Name,
    PublicIpAddress: info.PublicIpAddress ?? null,
  };
};

const startInstance = async () => {
  const start_cmd = new StartInstancesCommand(instanceSelector);
  return await client.send(start_cmd);
};

export const handler = async () => {
  try {
    const info = await describeInstance();

    if (info.State === "stopped") {
      await startInstance();
      info.starting = true;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(info),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: err.httpStatusCode ?? 500,
      body: "An error occured in start server",
    };
  }
};
