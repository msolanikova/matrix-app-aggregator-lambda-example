const jwt = require('jsonwebtoken');

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
    if(authorizationHeader) {
        let clientId = getClientId(authorizationHeader) || "Unknown"
        console.log(clientId)
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                jwt: authorizationHeader,
                clientId: clientId
            })
        }
    } else {
        return {
            statusCode: 401,
            headers: getCorsHeaders(),
            body: JSON.stringify({error: "Authorization header missing"})
        }
    }
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