// Define AWS
const AWS = require('aws-sdk');
// Update the region associated with the account on AWS
AWS.config.update({ region: 'us-east-1' });
// Define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
// Grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoTable = 'bidding';
// Bcrypt to ensure that we do not save password in plain text
const bcrypt = require('bcryptjs');
// Our updateResponse in the util
let util = require('../utils/response');

const getApprentice = async (apprentice) => {
  const stripe = require('stripe')(`${process.env.STRIPE_KEY}`);
  const email = apprentice.email;
  // This function will return a single apprentice profile based on email
  const getUser = async (email) => {
    const parameters = {
      TableName: dynamoTable,
      Key: {
        owner: email,
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
      .catch((err) => console.log(err, '<-- Error getting the user.'));
  };

  const singleApprentice = await getUser(email);
  const apprenticeStripeId = singleApprentice.stripeID;

  const account = await stripe.accounts.retrieve(apprenticeStripeId);

  return util.updateResponse(200, {
    singleApprentice: singleApprentice,
    account: account.payouts_enabled,
  });
};

module.exports.getApprentice = getApprentice;
