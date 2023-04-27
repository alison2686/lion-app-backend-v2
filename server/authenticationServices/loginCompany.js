//define AWS
const AWS = require("aws-sdk");
//update the region associated with the account on AWS
AWS.config.update({ region: "us-east-1" });
//define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
//grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoTable = "companyUsers";
//bcrypt to ensure that we do not save password in plain text
const bcrypt = require("bcryptjs");
// require utils/auth.js
const auth = require("../utils/auth");
//our updateResponse in the util
const util = require("../utils/response");

//login functionality
const loginCompany = async (company) => {
  const email = company.email;
  const password = company.password;
  // Checks if all fields are filled out
  if (!company || !email || !password) {
    return util.updateResponse(403, {
      message: "company name and Password are required.",
    });
  }
  // checks if user and user email exist
  const dynamoCompany = await getCompany(email);
  if (!dynamoCompany || !dynamoCompany.email) {
    return util.updateResponse(403, {
      message: "Company User does not exist.",
    });
  }
  //Checks if passwords match
  if (!bcrypt.compareSync(password, dynamoCompany.password)) {
    return util.updateResponse(403, {
      message: "Password is incorrect.",
    });
  }
  // Generating token using auth.js utils file
  const companyInfo = {
    email: dynamoCompany.email,
    firstName: dynamoCompany.firstName,
    lastName: dynamoCompany.lastName,
  };
  const token = auth.generateToken(companyInfo);
  const response = {
    company: companyInfo,
    token: token,
  };
  return util.updateResponse(200, response);
};

//gets all the user info and looks in the database to see if it exists
const getCompany = async (email) => {
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
        console.error("There is an error getting company user: ", error);
      }
    );
};

module.exports.loginCompany = loginCompany;
