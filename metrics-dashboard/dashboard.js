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
    console.log(`event: ${event}`);
    console.log(`context: ${context}`);
    let teams = utils.getAllTeamNames();
    let startDate = utils.parseTimestampToDate(defaultStartDate);
    let endDate = utils.parseTimestampToDate(defaultEndDate);
    if (event.queryStringParameters) {
        startDate = event.queryStringParameters.startDate ? event.queryStringParameters.startDate : startDate;
        endDate = event.queryStringParameters.endDate ? event.queryStringParameters.endDate : endDate;
    }

    if (Date.parse(startDate) >= Date.parse(endDate)) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: `End date has to be AFTER start date: startDate = ${startDate}, endDate = ${endDate}`
            })
        }
    }

    let teamsPromises = [];
    teamsPromises.push(getGithubScore(startDate, endDate))
    teams.forEach(team => {
        teamsPromises.push(getVelocityForTeam(team, startDate, endDate));
    })

    return Promise.all(teamsPromises)
        .then(data => {
            let githubData = data[0].teams
            let jiraData = data.slice(1)
            return combineData(jiraData, githubData, teams)
        })
        .then(completeData => {
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    teams: completeData
                })
            };
        })
        .catch(error => {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    error: error.message
                })
            }
        });
};

function combineData(jiraData, githubData, teams) {
    let result = []
    teams.forEach(teamName => {
        let jiraObject = jiraData.find(j => j.name === teamName) || {
            avg_commitment: 0,
            avg_velocity: 0,
            overallVelocity: 0,
            overallCompletion: 0
        };
        let githubObject = githubData.find(g => g.teamName === teamName) || {
            teamScore: '0.00'
        }
        result.push({
            name: teamName,
            avg_commitment: jiraObject.avg_commitment,
            avg_velocity: jiraObject.avg_velocity,
            overallCompletion: jiraObject.overallCompletion,
            overallVelocity: jiraObject.overallVelocity,
            githubScore: githubObject.teamScore
        })
    })
    return result
}

function getGithubScore(startDate, endDate) {
    let githubBackendUrl = utils.getGithubBackendUrl();
    return axios
        .get(`${githubBackendUrl}/teamsScores`, {
            params: {
                startDate: startDate,
                endDate: endDate
            }
        })
        .then(response => {
            return response.data
        })
        .catch(() => {
            return {
                teams: []
            }
        })
}

function getVelocityForTeam(team, startDate, endDate) {
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
            let data = response.data;
            return calculateAverageCommitmentAndVelocityForTeam(data.sprints, team, data.overallVelocity, data.overallCompletion);
        })
        .catch(() => {
            let defaultResult = {
                name: team,
                avg_commitment: 0,
                avg_velocity: 0,
                overallVelocity: 0,
                overallCompletion: 0
            };
            return Promise.resolve(defaultResult);
        });
}

function calculateAverageCommitmentAndVelocityForTeam(sprintsVelocities, team, overallVelocity, overallCompletion) {
    let commitmentSum = 0;
    let velocitySum = 0;
    sprintsVelocities.forEach(sprintVelocity => {
        commitmentSum += sprintVelocity.commitment;
        velocitySum += sprintVelocity.velocity;
    });
    let avgCommitment = sprintsVelocities.length == 0 ? 0 : new Number((commitmentSum / sprintsVelocities.length).toFixed(1));
    let avgVelocity = sprintsVelocities.length == 0 ? 0 : new Number((velocitySum / sprintsVelocities.length).toFixed(1));
    let result = {
        name: team,
        avg_commitment: avgCommitment,
        avg_velocity: avgVelocity,
        overallVelocity: overallVelocity ? overallVelocity : 0,
        overallCompletion: overallCompletion ? overallCompletion : 0
    };
    return result;
}

function getCorsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"
    };
}