//define AWS
const AWS = require("aws-sdk");
//update the region associated with the account on AWS
AWS.config.update({ region: "us-east-1" });
//define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
//grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoTable = "lionheart";
const dynamoBidTable = "bidding"

let util = require("../utils/response");

const registerStripeUser = async (stripeBody) => {
  //NEED TO ADD .toLowercase check to make sure searching exact email, regex expressions
  //NEED TO ADD update apprentice profile status (NOT BID STATUS)
  const activeStatus = true
  const email = stripeBody.email;
  const stripe = require("stripe")(
    `sk_test_51GvqxNE4rKR2mTzgerNRrKNzy1INkzh0FlrtuYx23On86l5SAVR2ufnR9OloQnAtMV2tHik9aA7eZhgJEWWx3Heh005OZJYqxI`
  );

  // This function creates a blank custom Stripe account
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  //This function grabs the empty Stripe account we just created,
  // and makes an onboarding link for it
  const accountLink = await stripe.accountLinks.create({
    account: `${account.id}`,
    refresh_url: "https://google.com",
    return_url: "https://google.com",
    type: "account_onboarding",
    collect: "eventually_due",
  });

  // This function grabs the requestBody (which should be the users email)
  // and finds the user that matches in our dynamoDB
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
        return res.Item;
      })
      //we need to catch the error if any
      .catch((err) => console.log(err, "<-- Error getting the user."));
  };

  const dynamoUser = await getUser(email);

  //Grab dynamoUser.email, find that user in DynamoDB, push the
  // account.id into their stripeID field
  const userEmail = dynamoUser.email;
  const stripeID = account.id;

  const updateUser = async (email, stripeID) => {
    const params = {
      TableName: dynamoTable,
      Key: {
        email: email,
      },
      UpdateExpression: "set stripeID = :stripeID",
      ExpressionAttributeValues: {
        ":stripeID": stripeID,
      },
      ReturnValues: "UPDATED_NEW",
    };
    return await dynamobdb
      .update(params)
      .promise()
      .then((res) => {
        return res.Item;
      })
      .catch((err) => console.log(err, "<- Error updating user"));
  };

  const userUpdated = await updateUser(userEmail, stripeID);


  //NEED FUNCTION THAT WILL CREATE BIDDING PROFILE FOR STRIPE USER
  //MAY NEED THIS TO BE ON A SEPERATE ENDPOINT IN FUTURE

  // const bidUser = {
  //   owner: userEmail,
  //   stripeID: stripeID,
  //   bid: {
  //     "amount": 15,
  //     "paymentId": ""
  //   },
  //   bidStatus: 'Closed',  //Change this state when user enters a contract
    
  // }

  // const createBidProfile = async(user) => {
  //   const parameters = {
  //     TableName: dynamoBidTable,
  //     Item: user,
  //   };
  //   return await dynamobdb
  //     .put(parameters)
  //     //needs to go through the promise to ensure that the first request is fulfilled
  //     .promise()
  //     //once it is fulfilled, it moves on to the return
  //     .then((res) => {
  //       return true;
  //     })
  //     //we need to catch the error if any
  //     .catch((err) => console.log(err, "<-- Error saving the user."));
  // }

  // const bidUserCreated = await createBidProfile(bidUser)

  //Still need error checks
  return util.updateResponse(200, {
    // bidUserCreated: bidUserCreated,
    userUpdated: userUpdated,
    dynamoUser: dynamoUser.email,
    accountLink: accountLink.url,
    account: account.id,
  });
};

module.exports.registerStripeUser = registerStripeUser;
