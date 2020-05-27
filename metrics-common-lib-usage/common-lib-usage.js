const common = require('@msolanikova/matrix-app-aggregator-common-lib')

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

    try {
        let teamNames = await common.utils.getAllTeamNames(1);
        console.log(`team names from utils: ${teamNames}`);

        console.log("3 x 5 = " + common.calculator.multiply(3, 5));

        console.log("Some other actions here")

        return {
            statusCode: 200,
            body: 'OK'
        }
    } catch(err) {
        console.log(err);
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: err
            })
        }
    }
}