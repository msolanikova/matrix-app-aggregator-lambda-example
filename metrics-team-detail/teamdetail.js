const utils = require('./utils.service')
const axios = require('axios')
const defaultEndDate = Date.now();
const defaultStartDate = new Date(defaultEndDate).setDate(new Date(defaultEndDate).getDate() - 30);

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
    let startDate = utils.parseTimestampToDate(defaultStartDate);
    let endDate = utils.parseTimestampToDate(defaultEndDate);
    let team;
    if(event.queryStringParameters) {
        startDate = event.queryStringParameters.startDate ? event.queryStringParameters.startDate : startDate;
        endDate = event.queryStringParameters.endDate ? event.queryStringParameters.endDate : endDate;
        team = event.queryStringParameters.team;
    }

    if(!team) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({error: "team parameter is missing"})
        }
    }

    let jiraBackendUrl = utils.getJiraBBackendUrl();
    return axios
        .get(`${jiraBackendUrl}/jira/velocity`, {
            params: {
                team: team,
                startDate: startDate,
                endDate: endDate
            }
        })
        .then(response => {
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({velocities : response.data})
            }
        })
        .catch(error => {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({error : error.message})
            }
        });

}

function getCorsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"
    };
}