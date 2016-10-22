var AWS = require('aws-sdk');  
var uuid = require('uuid');  
var docClient = new AWS.DynamoDB.DocumentClient();

var dynamoTableName = "SavegameAPI";

//-------------------------------------------------

var loadUser = (userId, authToken, callback) => {

  var params = {
    TableName: dynamoTableName,
    Key: {
      userId: userId
    }
  };

  return docClient.get(params, function(err, data) {
    if (data && data.Item && data.Item.authToken == authToken) {
      return callback(err, {
        user: data.Item
      });
    } else {
      return callback(err, {});
    }
  });

};

//-------------------------------------------------

var saveUser = (userId, authToken, userData, callback) => {

  // load here to check the auth token
  return loadUser(userId, authToken, function(err, data) {

    if (err || ! data.user) {
      return callback(err, data);
    }

    // for saving some write capacity check here for values that changed
    // and update only them

    // don't overwrite userId and authToken:
    userData.authToken = authToken;
    userData.userId = userId;

    var params = {
      TableName:dynamoTableName,
      Item: userData
    };

    return docClient.put(params, function(err, data) {
      return callback(err, {
        user: userData
      });
    });
  });

};

//-------------------------------------------------

var generateAndSaveUser = (userData, callback) => {

  userData.userId = uuid.v4();
  userData.registered = (new Date()).getTime();
  userData.authToken = uuid.v4().substring(0,8);

  var params = {
    TableName: dynamoTableName,
    Item: userData
  };

  return docClient.put(params, function(err, data) {
    return callback(err, {
      user: userData,
      authToken: userData.authToken     // for a new user we have to return the auth Token
    });
  });

};

//-------------------------------------------------

var processResponse = (err, userId, authToken, responseData, sourceFunction, callback) => {

  if (err) {
    console.log("##ERROR in " + sourceFunction + ": ", err);
    return callback("backend error");
  }

  if (! responseData.user) {
    console.log("##ERROR got no user for ", userId, " / ", authToken);
    return callback("auth error");
  }

  delete responseData.user.authToken;     // we do not send the auth token back
  return callback(null, responseData);

};

//-------------------------------------------------

var handler = (event, context, callback) => {

  switch(event.operation) {

    case 'register':

      var userData = event.body ? event.body : {};

      return generateAndSaveUser(userData, function(err, data) {
        return processResponse(err, null, null, data, "generateAndSaveUser", callback);
      });

    case 'load':

      var userId = event.params.userId;
      var authToken = event.headers.authToken;

      return loadUser(userId, authToken, function(err, data) {
        return processResponse(err, userId, authToken, data, "loadUser", callback);
      });

    case 'save':

      var userId = event.params.userId;
      var authToken = event.headers.authToken;

      return saveUser(userId, authToken, event.body.user, function(err, data) {
        return processResponse(err, userId, authToken, data, "saveUser", callback);
      });
  }

};

//-------------------------------------------------

exports.handler = handler;
