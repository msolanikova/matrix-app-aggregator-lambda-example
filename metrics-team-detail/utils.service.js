const settings = require('./settings.json')

function getJiraBBackendUrl() {
    return settings.jiraBackendUrl;
}

function getGithubBackendUrl() {
    return settings.githubBackendUrl;
}

function getAllTeamNames() {
    return settings.teams.map(team => team.teamName);
}

function getPort() {
    return settings.port;
}

/* From given timestamp returns string of date in format YYYY-MM-dd */
function parseTimestampToDate(timestamp) {
    let todate = new Date(timestamp).getUTCDate()
    let tomonth = new Date(timestamp).getUTCMonth() + 1
    let toyear = new Date(timestamp).getUTCFullYear()
    return toyear + "-" + tomonth + "-" + todate
}

module.exports = {
    getJiraBBackendUrl,
    getAllTeamNames,
    getPort,
    parseTimestampToDate,
    getGithubBackendUrl
}
