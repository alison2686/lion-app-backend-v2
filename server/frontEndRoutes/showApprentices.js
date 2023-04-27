//define AWS
const AWS = require("aws-sdk");
//update the region associated with the account on AWS
AWS.config.update({ region: "us-east-1" });
//define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
//grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoTable = "lionheart";
const dynamoBidTable = "bidding";
//bcrypt to ensure that we do not save password in plain text
const bcrypt = require("bcryptjs");
//our updateResponse in the util
let util = require("../utils/response");

const showApprentices = async () => {

  const getUserProfile = async (email) => {
    const parameters = {
      TableName: dynamoTable,
      Key: {
        email: email,
      },
    };
    return await dynamobdb
      .get(parameters)
      // Needs to go through the promse to ensure that the first request is fulfilled
      .promise()
      // Once it is fulfilled, it moves on to the return
      .then((res) => {
        return res.Item;
      })
      // We need to catch the error if any
      .catch((err) => console.log(err, "<-- Error getting the user."));
  };

  const getValidatedUsers = async () => {
    const paramaters = {
      TableName: dynamoBidTable,
      FilterExpression: "bidStatus = :activeStatus",
      ExpressionAttributeValues: {
        ":activeStatus": "Open",
      },
    };
    return await dynamobdb
      .scan(paramaters)
      //needs to go through the promse to ensure that the first request is fulfilled
      .promise()
      //once it is fulfilled, it moves on to the return
      .then((res) => {
        return res.Items;
      })
      //we need to catch the error if any
      .catch((err) => console.log(err, "<-- Error getting the user."));
  };

  const validatedUsers = await getValidatedUsers();

  const returnUsersArray = async () => {
    const returnUsers = [];

      //Need to grab each user by email, then grab their apprentice profile
      //Push apprentice profile into returnUsers array
      //Send returnUsers array back to the client
      for (const item of validatedUsers) {
        const apprenticeEmail = item.owner;
        const apprenticeProfile = await getUserProfile(apprenticeEmail);
        returnUsers.push(apprenticeProfile);
      }
      return returnUsers;

}

const response = await returnUsersArray();


  return util.updateResponse(200, {
    apprenticeUsers: response,
  });
};

module.exports.showApprentices = showApprentices;
