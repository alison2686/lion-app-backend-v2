//define AWS
const AWS = require("aws-sdk");
//update the region associated with the account on AWS
AWS.config.update({ region: "us-east-1" });
//define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
//grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoTable = "apprenticeUsers";
//bcrypt to ensure that we do not save password in plain text
const bcrypt = require("bcryptjs");
// require utils/auth.js
const auth = require("../utils/auth");
//our updateResponse in the util
const util = require("../utils/response");

//login functionality
const login = async (user) => {
  const email = user.email;
  const password = user.password;
  // Checks if all fields are filled out
  if (!user || !email || !password) {
    return util.updateResponse(403, {
      message: "User name and Password are required.",
    });
  }
  // checks if user and user email exist
  const dynamoUser = await getUser(email);
  if (!dynamoUser || !dynamoUser.email) {
    return util.updateResponse(403, {
      message: "User does not exist.",
    });
  }
  //Checks if passwords match
  if (!bcrypt.compareSync(password, dynamoUser.password)) {
    return util.updateResponse(403, {
      message: "Password is incorrect.",
    });
  }
  // Generating token using auth.js utils file
  const userInfo = {
    email: dynamoUser.email,
    firstName: dynamoUser.firstName,
    lastName: dynamoUser.lastName,
  };
  const token = auth.generateToken(userInfo);
  const response = {
    user: userInfo,
    token: token,
  };
  return util.updateResponse(200, response);
};

//gets all the user info and looks in the database to see if it exists
const getUser = async (email) => {
  const paramaters = {
    TableName: dynamoTable,
    Key: {
      email: email,
    },
  };
  return await dynamobdb
    .get(paramaters)
    .promise()
    .then(
      (response) => {
        return response.Item;
      },
      (error) => {
        console.error("There is an error getting user: ", error);
      }
    );
};

module.exports.login = login;
