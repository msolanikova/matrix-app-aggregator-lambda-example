const AWS = require('aws-sdk')

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
    console.debug(event);
    console.debug(context);

    let stage = process.env.stage;
    console.log(stage);

    let now = new Date();

    let dataToWrite = {
        timestamp: now.getTime(),
        hour: now.getHours()
    }

    let dynamoClient = new AWS.DynamoDB.DocumentClient();

    let params = {
        Item: dataToWrite,
        ReturnValues: "ALL_OLD",
        TableName: stage + "-client1-collecteddata"
    }

    return dynamoClient.put(params).promise()
        .then(data => {
            console.log(data);
        })
        .catch(err => {
            console.log(err);
        });
}