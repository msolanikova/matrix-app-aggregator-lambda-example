const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// settings TTL in milliseconds to represent the expiration time for settings cache
// 10 min = 10 * 60 * 1000 milliseconds = 600 000
const settingsTtl = 600000;

let settings;
let settingsCacheTime = Date.now();

function loadSettings() {
    // check if settings are cached and the TTL didn't expire
    if (!settings || Date.now() - settingsCacheTime > 0) {
        return s3.getObject({ Bucket: 'metrics-app', Key: 'settings.json' }).promise()
            .then(res => {
                settings = JSON.parse(res.Body);
                settingsCacheTime = Date.now() + settingsTtl;
                return settings;
            });
    } else {
        return Promise.resolve(settings);
    }
}

function getJiraBackendUrl(clientId) {
    return loadSettings()
        .then(settings => {
            return settings.clients[clientId].jiraBackendUrl;
        })
        .catch(err => {
            handleJsonParsingError(clientId, err);
        });
}

function getGithubBackendUrl(clientId) {
    return loadSettings()
        .then(settings => {
            return settings.clients[clientId].githubBackendUrl;
        })
        .catch(err => {
            handleJsonParsingError(clientId, err);
        });
}

function getAllTeamNames(clientId) {
    return loadSettings()
        .then(settings => {
            return settings.clients[clientId].teams.map(team => team.teamName);
        })
        .catch(err => {
            handleJsonParsingError(clientId, err);
        });
}

/* From given timestamp returns string of date in format YYYY-MM-dd */
function parseTimestampToDate(timestamp) {
    let toDate = new Date(timestamp).getUTCDate()
    let toMonth = new Date(timestamp).getUTCMonth() + 1
    let toYear = new Date(timestamp).getUTCFullYear()
    return toYear + "-" + toMonth + "-" + toDate;
}

/* From given timestamp returns string of date in ISO format  */
function parseTimestampToDateISO(timestamp) {
    return new Date(timestamp).toISOString();
}

function getClientId(req) {
    const clientId = req.get('Authorization');
    if (!clientId) {
        const error = new Error("Authorization header is missing in the request. Please provide client ID value in Authorization header.");
        error.status = 401;
        throw error;
    }
    return clientId;
}

function handleJsonParsingError(clientId, err) {
    if (!settings.clients[clientId]) {
        throw new Error(`Configuration for client ID [${clientId}] was not found in settings file.`);
    }
    throw err;
}

function getDateIntervalsWeekly(startDate, endDate) {
    let startDateAcc = startDate;
    let intervals = [];
    while (startDateAcc < endDate) {
        let intervalStart = startDateAcc;
        let tmpDate = new Date(startDateAcc);
        startDateAcc = tmpDate.setDate(tmpDate.getDate() + 7);
        intervals.push({
            startDate: parseTimestampToDateISO(intervalStart),
            endDate: parseTimestampToDateISO(startDateAcc > endDate ? endDate : startDateAcc)
        });
    }
    return JSON.stringify(intervals);
}

module.exports = {
    loadSettings,
    getJiraBackendUrl,
    getGithubBackendUrl,
    getAllTeamNames,
    getClientId,
    parseTimestampToDate,
    parseTimestampToDateISO,
    handleJsonParsingError,
    getDateIntervalsWeekly
}