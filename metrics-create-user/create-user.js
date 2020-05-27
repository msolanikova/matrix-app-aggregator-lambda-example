const jwt = require('jsonwebtoken');
let AWS = require("aws-sdk");

const USER_POOL_ID = "eu-central-1_EKP1xxXA5";
const cognitoClient = new AWS.CognitoIdentityServiceProvider();

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.handler = async (event, context) => {
    console.log(event);
    console.log(context);

    let authorizationHeader = event.headers["Authorization"];
    if(!authorizationHeader) {
        // this shouldn't happen as it will be called via API Gateway with Authorizer
        return {
            statusCode: 401,
            headers: getCorsHeaders(),
            body: JSON.stringify({error: "Authorization header missing"})
        }
    }

    let clientId = getClientId(authorizationHeader) || "Unknown";
    let emails = event.multiValueQueryStringParameters.emails || [];

    let promiseArray = [];

    emails.forEach(email => promiseArray.push(createUserInCognito(email, clientId)));
    return Promise.all(promiseArray)
        .then(data => {
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify(data)
            }
        });
}

function createUserInCognito(email, clientId) {
    console.log(`Creating user with email: ${email} for client id: ${clientId}`);

    var poolData = {
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
            {
                Name: "email",
                Value: email
            },
            {
                Name: "custom:clientId",
                Value: clientId
            }
        ]
    };
    let createUserData;
    return cognitoClient.adminCreateUser(poolData).promise()
        .then(data => {
            createUserData = data;
            return addUserToUserGroup(email);
        })
        .then(data => {
            return {
                success: true,
                email: email,
                data: createUserData
            }
        })
        .catch(err => {
            return {
                success: false,
                email: email,
                error: err
            }
        });
}

function addUserToUserGroup(email){
    let params = {
        GroupName: 'user',
        UserPoolId: USER_POOL_ID,
        Username: email
    };
    return cognitoClient.adminAddUserToGroup(params).promise();
}

function getClientId(authorizationHeader) {
    let decodedJwt = jwt.decode(authorizationHeader);
    return decodedJwt['custom:clientId'];
}

function getCorsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"
    };
}