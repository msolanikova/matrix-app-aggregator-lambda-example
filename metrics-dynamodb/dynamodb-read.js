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

    let team, username, start, end;

    if(event.queryStringParameters) {
        team = event.queryStringParameters.team;
        username = event.queryStringParameters.username;
        start = event.queryStringParameters.start;
        end = event.queryStringParameters.end;
    }

    if(!start || !end) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: `Missing required parameter. start = ${start}, end = ${end}`})
        }
    }

    var myRe = /^\d{4}-\d{2}-\d{2}$/;
    if(!myRe.test(start) || !myRe.test(end)) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: `Required parameters in wrong format. Correct format is YYYY-MM-DD. start = ${start}, end = ${end}`})
        }
    }

    let params;

    if(team) {
        params = {
            KeyConditionExpression: "#team = :team AND #day BETWEEN :start AND :end",
            ExpressionAttributeNames: {
                "#team": "team",
                "#day": "day"
            },
            ExpressionAttributeValues: {
                ":team": team,
                ":start": start,
                ":end": end
            },
            Select: "COUNT",
            TableName: "client1-activedays",
            IndexName: "team-day-index"
        };
    } else if (username) {
        params = {
            KeyConditionExpression: "#username = :user AND #day BETWEEN :start AND :end",
            ExpressionAttributeNames: {
                "#username": "username",
                "#day": "day"
            },
            ExpressionAttributeValues: {
                ":user": username,
                ":start": start,
                ":end": end
            },
            Select: "COUNT",
            TableName: "client1-activedays"
        };
    } else {
        params = {
            KeyConditionExpression: "#username = :user AND #day BETWEEN :start AND :end",
            ExpressionAttributeNames: {
                "#username": "username",
                "#day": "day"
            },
            ExpressionAttributeValues: {
                ":user": "user1",
                ":start": start,
                ":end": end
            },
            Select: "COUNT",
            TableName: "client1-activedays"
        };
    }

    let dynamoClient = new AWS.DynamoDB.DocumentClient();
    return dynamoClient.query(params).promise()
        .then(items => {
            console.log(items);
            return {
                statusCode: 200,
                body: JSON.stringify(items)
            }
        })
        .catch(err => {
            return {
                statusCode: 400,
                body: JSON.stringify({error: err})
            }
        })
}