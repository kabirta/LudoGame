const googleServices = require('../../google-services.json');

const ANDROID_PACKAGE_NAME = 'com.kabir.ludozeng';

const projectInfo = googleServices.project_info;
const appClient =
  googleServices.client.find(
    client =>
      client.client_info?.android_client_info?.package_name ===
      ANDROID_PACKAGE_NAME,
  ) ?? googleServices.client[0];

if (!projectInfo || !appClient) {
  throw new Error('Invalid google-services.json: missing Android Firebase config.');
}

const androidOAuthClient =
  appClient.oauth_client?.find(
    client =>
      client.client_type === 1 &&
      client.android_info?.package_name === ANDROID_PACKAGE_NAME,
  ) ?? appClient.oauth_client?.find(client => client.client_type === 1);

const apiKey = appClient.api_key?.[0]?.current_key;
const appId = appClient.client_info?.mobilesdk_app_id;

if (!apiKey || !appId) {
  throw new Error(
    'Invalid google-services.json: missing Android api key or app id.',
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: `${projectInfo.project_id}.firebaseapp.com`,
  databaseURL: projectInfo.firebase_url,
  projectId: projectInfo.project_id,
  storageBucket: projectInfo.storage_bucket,
  messagingSenderId: projectInfo.project_number,
  appId,
};

const googleAuthConfig = {
  androidClientId: androidOAuthClient?.client_id ?? null,
};

module.exports = {
  firebaseConfig,
  googleAuthConfig,
};
