//files linked to each of the services the user will be provided
const registerUser = require("./authenticationServices/register");
const loginUser = require("./authenticationServices/login");
const verifyUser = require("./authenticationServices/verification");
const loginCompany = require("./authenticationServices/loginCompany");
const registerCompany = require("./authenticationServices/registerCompany");
const registerStripeUser  = require("./authenticationServices/registerStripeUser");
const showApprentices = require("./frontEndRoutes/showApprentices")
const getApprentice = require("./frontEndRoutes/getApprentice")
const submitBid = require("./stripe/submitBid")
const validateStripe = require("./stripe/validateStripe")

//all the pathways for the authentication
const healthCheckPath = "/healthcheck";
const loginPath = "/login";
const registerPath = "/register";
const verificationPath = "/verification";
const loginCompanyPath = "/login-company"
const registerCompanyPath = "/register-company"
const registerStripeUserPath = '/register-stripe'
const showApprenticesPath = '/showapprentices'
const getApprenticePath = '/get-apprentice'
const submitBidPath = '/submit-bid'
const validateStripePath = '/validate-stripe'

//to test each endpoint and ensure the status is returning OK
exports.handler = async (e) => {
  //this object stringifies the 200 status code
  let res = {
    isBase64Encoded: true | false,
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify(200),
  };
  //all the endpoints being tested with method and pathway confirmation
  if (e.httpMethod === "GET" && e.path === healthCheckPath) {
    return res;
  } else if (e.httpMethod === "POST" && e.path === verificationPath) {
    const verifyBody = JSON.parse(e.body);
    return (res = verifyUser.verify(verifyBody));
  } else if (e.httpMethod === "POST" && e.path === loginPath) {
    const loginBody = JSON.parse(e.body);
    return (res = await loginUser.login(loginBody));
  } else if (e.httpMethod === "POST" && e.path === registerPath) {
    //to grab the request body
    const registerBody = JSON.parse(e.body);
    //for dyanamodb we want to use async functions
    return (res = await registerUser.register(registerBody));
  } else if (e.httpMethod === "POST" && e.path === loginCompanyPath) {
    const loginCompanyBody = JSON.parse(e.body);
    return (res = await loginCompany.loginCompany(loginCompanyBody));
  } else if (e.httpMethod === "POST" && e.path === registerCompanyPath) {
    const registerCompanyBody = JSON.parse(e.body);
    return (res = await registerCompany.registerCompany(registerCompanyBody));
  } else if (e.httpMethod === "POST" && e.path === registerStripeUserPath) {
    const stripeBody = JSON.parse(e.body);
    return (res = await registerStripeUser.registerStripeUser(stripeBody));
  } else if(e.httpMethod === "GET" && e.path === showApprenticesPath){
    return(res = await showApprentices.showApprentices())
  } else if (e.httpMethod === "POST" && e.path === getApprenticePath) {
    const apprenticeBody = JSON.parse(e.body)
    return (res = await getApprentice.getApprentice(apprenticeBody))
  } else if(e.httpMethod === "POST" && e.path === submitBidPath){
    const bidBody = JSON.parse(e.body);
    return(res = await submitBid.submitBid(bidBody));
  } else if(e.httpMethod === "POST" && e.path === validateStripePath){
    const validateBody = JSON.parse(e.body);
    return(res = await validateStripe.validateStripe(validateBody));
  } else {
    return res;
  }
};
