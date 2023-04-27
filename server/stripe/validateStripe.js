// Define AWS
const AWS = require("aws-sdk");
// Update the region associated with the account on AWS
AWS.config.update({ region: "us-east-1" });
// Define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
// Grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoTable = "lionheart";
const dynamoBidTable = "bidding";
// Bcrypt to ensure that we do not save password in plain text
const bcrypt = require("bcryptjs");
// Our updateResponse in the util
let util = require("../utils/response");

const validateStripe = async (apprentice) => {
  const stripe = require("stripe")(
    `sk_test_51GvqxNE4rKR2mTzgerNRrKNzy1INkzh0FlrtuYx23On86l5SAVR2ufnR9OloQnAtMV2tHik9aA7eZhgJEWWx3Heh005OZJYqxI`
  );
  const email = apprentice.email;
  // This function will return a single apprentice profile based on email
  const getUser = async (email) => {
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

  
  const createBidProfile = async(user) => {
    const parameters = {
      TableName: dynamoBidTable,
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
  }

  const singleApprentice = await getUser(email);
  const apprenticeStripeId = singleApprentice.stripeID;

  const account = await stripe.accounts.retrieve(apprenticeStripeId);

  if (account.payouts_enabled) {
    const userEmail = singleApprentice.email;
    const stripeID = apprenticeStripeId
    const bidUser = {
      owner: userEmail,
      stripeID: stripeID,
      bid: {
        amount: 15,
        paymentId: "",
      },
      bidStatus: "Open", //Change this state when user enters a contract
    };

    await createBidProfile(bidUser)

    return util.updateResponse(200, {
        message: "Your account is enabled for payouts. Companies can now bid on you",
    })

  } else {
    return util.updateResponse(400, {
      message: "Your account is not enabled for payouts.",
    });
  }


};

module.exports.validateStripe = validateStripe;