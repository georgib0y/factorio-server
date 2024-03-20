"use strict";

import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const instanceSelector = { InstanceIds: [process.env.EC2_ID] };

const client = new EC2Client({
  reigon: "ap-southeast-2",
});

const getInstanceState = async () => {
  const desc_cmd = new DescribeInstancesCommand(instanceSelector);
  const res = await client.send(desc_cmd);
  const info = res.Reservations[0].Instances[0];

  if (!info) {
    throw new Error(`Could not get instance for id="${process.env.EC2_ID}"`);
  }

  return {
    State: info.State.Name,
    PublicIpAddress: info.PublicIpAddress ?? null,
  };
};

export const handler = async () => {
  try {
    const info = await getInstanceState();

    return {
      statusCode: 200,
      body: JSON.stringify(info),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: err.httpStatusCode ?? 500,
      body: {
        error: "An error occured in check-status, check logs for info",
      },
    };
  }
};
