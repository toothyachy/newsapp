const { SSMClient, GetParametersByPathCommand } = require("@aws-sdk/client-ssm");

const client = new SSMClient();
const input = {
    Path: "/newsapp/prod",
    Recursive: true,
    WithDecryption: true,
    MaxResults: Number("3"),
};
const command = new GetParametersByPathCommand(input);

let parameters;

const getParams = async () => {
    try {
        const response = await client.send(command);
        const params = response.Parameters;

        let parameters = {};
        params.forEach(item => {
            const { Name: path, Value: value } = item;
            const splits = path.split('/');
            const name = splits[splits.length - 1]
            parameters[name] = value;
        });
        return parameters
    } catch (err) {
        console.log(err);
    }
}

// getParams().then((result) => {
//     parameters = result;
//     console.log("Parameters: ", parameters);
//     module.exports = parameters
// })

// Exported function to get parameters
module.exports = function getParameters() {
    return new Promise((resolve, reject) => {
        // Check if parameters are already fetched
        if (typeof parameters !== 'undefined') {
            resolve(parameters); // Resolve with cached parameters
        } else {
            // Fetch parameters asynchronously
            getParams()
                .then(result => {
                    parameters = result; // Cache the parameters
                    resolve(parameters); // Resolve with fetched parameters
                })
                .catch(error => {
                    reject(error); // Reject with error if fetching fails
                });
        }
    });
};