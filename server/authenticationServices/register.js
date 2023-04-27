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
//our updateResponse in the util
let util = require('../utils/response')

const crypto = require('crypto')

//all the registration fields we currently would like for a user to input
const register = async (user) => {
  const firstName = user.firstName;
  const lastName = user.lastName;
  const email = user.email;
  const password = user.password;
  const phoneNumber = user.phoneNumber;
  const timezone = user.timezone;
  const skillSet = user.skillSet;
  const availability = user.availability;
  const workingHours = user.workingHours;
  const startDateAvailable = user.startDateAvailable;
  const dateOfBirth = user.dateOfBirth;
  const userID = crypto.randomBytes(16).toString("hex");
  const stripeID = "";
  const currentBidAmount = 15
  const activeStatus = false
  //401 error - client request is incomplete because there are not valid auth credentials / do NOT return a 404 status error or else it will say "Not Found"
  //if a user does not filled out below fields, they will be directed to complete this sections
  if (!firstName || !lastName || !email || !password) {
    return util.updateResponse
      (401,
      {
        message: "All fields must be filled.",
      });
  }
  //if this user exists in our database (same email, first, and last name), they cannot sign up again using the same credentials (we do not want multiple of the same user)
  const dynamodbUser = await getUser(email, firstName, lastName);
  if (
    dynamodbUser &&
    dynamodbUser.email 
  ) {
    return util.updateResponse
      (401,
      {
        message: "User already exists. Please choose different credentials.",
      });
  }

  //bcrypt the passwords for the user - the trim to to clean up white spaces
  const bcryptPassword = bcrypt.hashSync(password.trim(), 10);
  //these are all the properties and values associated with a user
  const userInfo = {
    //we want to ensure that whether a user is a lowercase "lionheart" or an uppercase "Lionheart", our system recognizes that it is the same user
    firstName: firstName.toLowerCase().trim(),
    lastName: lastName.toLowerCase().trim(),
    email: email,
    //encrypted password
    password: bcryptPassword,
    phoneNumber: phoneNumber,
    timezone: timezone,
    skillSet: skillSet,
    availability: availability,
    workingHours: workingHours,
    startDateAvailable: startDateAvailable,
    dateOfBirth: dateOfBirth,
    userID: userID,
    stripeID: stripeID,
    currentBidAmount: currentBidAmount,
    active: activeStatus
  };

  //saving the user response and using 503 status code - server is not ready to handle the request
  const userResponse = await saveUser(userInfo);
  if (!userResponse) {
    return util.updateResponse
      (503,
      {
        message: "Server error! Please try again.",
      });
  }
  //if no errors, return a 200 status and an object containing user's first and last name, along with their email
  return util.updateResponse
    (200,
    {
      firstName: firstName,
      lastName: lastName,
      email: email,
    });
};

//define the getUser (this is where we integrate in our database)
const getUser = async (email) => {
  const paramaters = {
    TableName: dynamoTable,
    Key: {
      email: email,
    },
  };
  return await dynamobdb
    .get(paramaters)
    //needs to go through the promse to ensure that the first request is fulfilled
    .promise()
    //once it is fulfilled, it moves on to the return
    .then((res) => {
      return res.Key;
    })
    //we need to catch the error if any
    .catch((err) => console.log(err, "<-- Error getting the user."));
};

//saving the user's information

const saveUser = async (user) => {
  const parameters = {
    TableName: dynamoTable,
    Item: user,
  };
  return await dynamobdb
    .put(parameters)
    //needs to go through the promise to ensure that the first request is fulfilled
    .promise()
    //once it is fulfilled, it moves on to the return
    .then((res) => {
      return true;
    })
    //we need to catch the error if any
    .catch((err) => console.log(err, "<-- Error saving the user."));
};

module.exports.register = register;
