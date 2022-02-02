// %%VARIABLES%% should be replaced during deployment
exports.hello = async (event) => {
  console.debug('Event: ', event);
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        apiVersion: '0.5.0',
        message: `Canary Deployment - %%COUNTRY%%@%%BRANCH%% at ${process.env.AWS_REGION}`,
        buildDate: '%%BUILDDATE%%',
      },
      null,
      2,
    ),
  };
};
