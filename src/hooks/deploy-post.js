const aws = require('aws-sdk');

const codedeploy = new aws.CodeDeploy({ apiVersion: '2014-10-06' });

module.exports.post = (event, context, callback) => {
  console.log('Starting pre-deploy hook.');
  console.log('Event: ', JSON.stringify(event, null, 2));

  const deploymentId = event.DeploymentId;
  const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

  console.log('Check some stuff after traffic has been shifted...');

  const params = {
    deploymentId,
    lifecycleEventHookExecutionId,
    status: 'Succeeded', // status can be 'Succeeded' or 'Failed'
  };

  return codedeploy.putLifecycleEventHookExecutionStatus(params).promise()
    .then((data) => callback(null, 'Validation test succeeded. Data: ', data))
    .catch((err) => callback('Validation test failed. Error: ', err));
};
