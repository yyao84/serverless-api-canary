const aws = require('aws-sdk');

const codedeploy = new aws.CodeDeploy({ apiVersion: '2014-10-06' });
const lambda = new aws.Lambda();

module.exports.pre = async (event, context, callback) => {
  console.log('Starting pre-deploy hook.');
  console.log('Event: ', JSON.stringify(event, null, 2));

  let functionToTest = '';
  let lambdaResult = 'Failed';

  // Read the DeploymentId and LifecycleEventHookExecutionId from the event payload
  const deploymentId = event.DeploymentId;
  const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

  const getDeployementParams = {
    deploymentId,
  };

  let deploymentAppName = '';
  let deploymentRevision = {};
  try {
    const deploymentData = await codedeploy
      .getDeployment(getDeployementParams)
      .promise();
    console.log('Deployment data: ', deploymentData);
    deploymentAppName = deploymentData.deploymentInfo.applicationName;
    deploymentRevision = deploymentData.deploymentInfo.revision;
    console.log('Deployment application name: ', deploymentAppName);
    console.log('Deployment revision name: ', deploymentRevision);
  } catch (err) {
    console.error('Error getting deployment data: ', err);
  }

  const getAppRevisionParams = {
    applicationName: deploymentAppName,
    revision: deploymentRevision,
  };

  try {
    const revisionData = await codedeploy
      .getApplicationRevision(getAppRevisionParams)
      .promise();
    console.log('Revision data: ', revisionData);
    const revisionContent = JSON.parse(
      revisionData.revision.string.content,
    );
    const revisionResource = revisionContent.Resources[0];
    const lambdaName = Object.keys(revisionResource)[0];
    const lambdaDetails = revisionResource[lambdaName].Properties;
    const lambdaCurrentVersion = lambdaDetails.CurrentVersion;
    const lambdaTargetVersion = lambdaDetails.TargetVersion;
    console.log(
      `Deployment of ${lambdaName} from version ${lambdaCurrentVersion} to ${lambdaTargetVersion}`,
    );
    functionToTest = `${lambdaName}:${lambdaTargetVersion}`;
  } catch (err) {
    console.error('Error getting revision data: ', err);
  }

  console.log('Testing new function version: ', functionToTest);

  const lambdaParams = {
    FunctionName: functionToTest,
    Payload: '{ }',
    InvocationType: 'RequestResponse',
  };

  // Invoke the updated Lambda function.
  try {
    const lambdaInvokeOutput = await lambda.invoke(lambdaParams).promise();
    const result = JSON.parse(lambdaInvokeOutput.Payload);
    const resultBody = JSON.parse(result.body);
    console.log('Result: ', JSON.stringify(result));
    console.log('statusCode: ', result.statusCode);
    console.log('apiVersion: ', resultBody.apiVersion);

    if (String(result.statusCode) === '200') {
      console.log('Validation succeeded');
      lambdaResult = 'Succeeded';
    } else {
      console.log('Validation failed');
    }
  } catch (err) {
    console.log('Lambda invoke failed', err);
  }

  // Complete the PreTraffic Hook by sending CodeDeploy the validation status
  const hookParams = {
    deploymentId,
    lifecycleEventHookExecutionId,
    status: lambdaResult, // status can be 'Succeeded' or 'Failed'
  };

  console.log('Notifying CodeDeploy with ', hookParams);

  return codedeploy
    .putLifecycleEventHookExecutionStatus(hookParams)
    .promise()
    .then((data) => callback(null, 'Validation test succeeded. Data: ', data))
    .catch((err) => callback('Validation test failed. Error: ', err));
};
