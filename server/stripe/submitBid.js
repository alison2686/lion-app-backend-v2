//define AWS
const AWS = require("aws-sdk");
//update the region associated with the account on AWS
AWS.config.update({ region: "us-east-1" });
//define the dynamobdb (this is our database)
const dynamobdb = new AWS.DynamoDB.DocumentClient();
//grab the dynamotable from AWS (dynamodb thrives off async functions)
const dynamoBidTable = "bidding";
const dynamoTable = "lionheart";
const dynamoCompanyTable = "lionheartCompany";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

//bcrypt to ensure that we do not save password in plain text
const bcrypt = require("bcryptjs");
//our updateResponse in the util
let util = require('../utils/response')


//TO DOS: 
    //NEED TO ADD currentBid field to apprentice account information
      //UPDATE that field as well so that the front end page will update the current amt
      // Field should reset to 15 once bid process is entirely complete

    //NEED TO ADD checks to see if this is the 'first' bid on this apprentice
    //If this is the initial bid, needs to set off the 48 hr timer function for this
    //specific apprentice

    //NEED TO ADD encryption to all sensitive payment information
    //Shouldn't need to decrypt again until sending the payment to apprentice


    //NEED TO ADD checks to confirm there are no duplicate bids being submitted

    //NEED TO ADD checks to confirm that the user is providing a valid payment method

  

const submitBid = async(bidBody) => {
  const stripe = require("stripe")(
    `sk_test_51GvqxNE4rKR2mTzgerNRrKNzy1INkzh0FlrtuYx23On86l5SAVR2ufnR9OloQnAtMV2tHik9aA7eZhgJEWWx3Heh005OZJYqxI`
  );
    //Need to grab all the company user's info from bidderBody, 
    const apprenticeEmail = bidBody.apprenticeEmail
    const companyEmail = bidBody.companyEmail
    const newBidAmount = bidBody.bidAmount
    const paymentId = bidBody.payment_method
   
    const customerName = bidBody.name
    const customerEmail = bidBody.customerEmail 
    const phone = bidBody.phone

   
    //
    const getBidProfile = async (email) => {
        const paramaters = {
          TableName: dynamoBidTable,
          Key: {
            owner: email,
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
    
    
      const bidUser = await getBidProfile(apprenticeEmail);
      const previousBidAmount = bidUser.bid.amount
      const apprenticeStripeId = bidUser.stripeID;

      const account = await stripe.accounts.retrieve(
        apprenticeStripeId
      );

      const paymentProfile = {
        amount: newBidAmount,
        previousBidAmount: previousBidAmount,
        paymentId: paymentId,
      }


    //   //This function will overwrite the apprentice's 
    //   // bidding profile with the new bid amount and paymendID
      const updateUser = async (apprenticeEmail, paymentProfile) => {
        const params = {
          TableName: dynamoBidTable,
          Key: {
            owner: apprenticeEmail,
          },
          UpdateExpression: "set bid = :newBid",
          ExpressionAttributeValues: {
            ":newBid": paymentProfile,
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

    //   //UPDATING APPRENTICE MAIN PROFILE 
    //   // SO CURRENT BID AMOUNT IS SHOWN ON FRONT END PAGE
      const updateUserProfile = async (apprenticeEmail, newBidAmount) => {
        const params = {
          TableName: dynamoTable,
          Key: {
            email: apprenticeEmail,
          },
          UpdateExpression: "set currentBidAmount = :newBid",
          ExpressionAttributeValues: {
            ":newBid": newBidAmount,
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

      const getCompanyTeam = async (companyEmail) => {
        const paramaters = {
          TableName: dynamoCompanyTable,
          Key: {
            email: companyEmail,
          },
        };
        return await dynamobdb
          .get(paramaters)
          //needs to go through the promse to ensure that the first request is fulfilled
          .promise()
          //once it is fulfilled, it moves on to the return
          .then((res) => {
            return res.Item.team;
          })
          //we need to catch the error if any
          .catch((err) => console.log(err, "<-- Error getting the user."));
      };
    

      const updateCompanyTeam = async (companyEmail, updatedTeam) => {
        const params = {
          TableName: dynamoCompanyTable,
          Key: {
            email: companyEmail,
          },
          UpdateExpression: "set team = :newTeam",
          ExpressionAttributeValues: {
            ":newTeam": updatedTeam,
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

    //IF NEW BID IS HIGHER, OVERWRITE APPRENTICES CURRENT BID W/ NEW BID INFO

      
      if(previousBidAmount < newBidAmount){
        /// MAKE SURE NOT UPDATING USER IF THE PAYMENT DOESNT GO THROUGH
        const userUpdated = await updateUser(apprenticeEmail, paymentProfile);
        const userProfileUpdated = await updateUserProfile(apprenticeEmail, newBidAmount);
        const apprenticeBidProfile = await getBidProfile(apprenticeEmail);
        // const apprenticeProfile = await getApprenticeProfile(apprenticeEmail);


        //Grabs current team from the company, then adds the apprenticeEmail to the team
        //Then pushes new team to the company's team array
        const newTeam = await getCompanyTeam(companyEmail);
        newTeam.push(apprenticeEmail);
        const  updateTeam = await updateCompanyTeam(companyEmail, newTeam);



        
        const chargeAmount = (previousBidAmount +1) *100;
        const createCharge = await stripe.paymentIntents.create({
                confirm: true,
                amount: chargeAmount, //Decimal amount must be at least 050
                currency: 'usd',
                // automatic_payment_methods: {enabled: true},
                payment_method_types: ['card'], //NEED TO SPECIFY THE PAYMENT METHOD TYPE
                payment_method: bidBody.payment_method, // the PaymentMethod ID sent by your client
                return_url: 'https://example.com/order/123/complete',
                transfer_data: {
                  destination: apprenticeStripeId, //Must be fully onboarded w/ transfers enabled
                },
              });
            //Then need to uppdate the apprentice's bid profile to bidStatus 'Closed'
              
          
        return util.updateResponse(200, {
          apprenticeBidProfile: apprenticeBidProfile,
          userProfileUpdated: userProfileUpdated,
          userUpdated: userUpdated,
          companyEmail: companyEmail,
          newTeam: newTeam,
          updateTeam: updateTeam,
          newBidAmount: newBidAmount,
          previousBidAmount: previousBidAmount,
          createCharge: createCharge,
          message: 'Bid Successful',
        });
       
      }else{
        return util.updateResponse(200, {
          bidUser: bidUser,
          newBidAmount: newBidAmount,
          previousBidAmount: previousBidAmount,
          message: "Bid Failed",
        });
      }
      

    //THIS SHOULD BE WHAT IS USED WHEN BIDDING TIME IS UP
    // GRAB THE CURRENT BID FROM DYNAMODB, WHICH SHOULD HOUSE THE PAYMENT METHOD ID

//     await stripe.paymentIntents.create({
//       confirm: true,
//       amount: 100, //Decimal amount must be at least 050
//       currency: 'usd',
//       // automatic_payment_methods: {enabled: true},
//       payment_method_types: ['card'], //NEED TO SPECIFY THE PAYMENT METHOD TYPE
//       payment_method: bidBody.payment_method, // the PaymentMethod ID sent by your client
//       return_url: 'https://example.com/order/123/complete',
//       transfer_data: {
//         destination: apprenticeStripeId, //Must be fully onboarded w/ transfers enabled
//       },
//     });
//     res.json({
//       client_secret: intent.client_secret,
//       status: intent.status
//     })

// return util.updateResponse(200, {
//   apprenticeEmail: apprenticeEmail,
//   bidUser: bidUser,
//   apprenticeStripeId: apprenticeStripeId,
//   account: account
// });


//Stripe account must be fully onboarded w/ transfers enabled
// Must be card payment (for now)

      // }

    //  return util.updateResponse(200, {
    //     updateUser: userUpdated,
    //     previousBidAmount: previousBidAmount,
    //     bidBody: bidBody,
    //     apprenticeEmail: apprenticeEmail,
    //     bidPayment: bidBody.payment_method,
    //     bidUser: bidUser,
    //     apprenticeStripeId: apprenticeStripeId
  
    //   });
    

}


module.exports.submitBid = submitBid;
