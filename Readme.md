# SavegameAPI - serverless backend without hosting costs

This repository is part of the tutorial under http://slin.cloud/how-to-setup-a-serverless-backend-without-hosting-costs-part-1-overview/
The following is the very short version how to set this up.

###DynamoDB

* Log in to the dynamoDB console
* Hit "Create table", set "SavegameAPI" as the table name, enter "userId" as the primary key (do not add a sort key) and leave the rest on default. The table will take a few moments to create.

[more info](http://slin.cloud/how-to-set-up-a-serverless-scalable-backend-without-hosting-costs-part-2-dynamodb/)

###Lambda

####set up the role
The lambda function needs permission to read and write from dynamoDB as well as writing logs. Set up a role like this:

* Select "IAM" from services
* In the left menu, select "Policies"
* Select "Create your own policy"
* Enter "AllowDynamoDBAccessAndLogs" as Policy Name and paste the following into the Policy Document box:

```language-json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Stmt1428341300017",
      "Action": [
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Sid": "",
      "Resource": "*",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Effect": "Allow"
    }
  ]
}
```

* Click on "Create Policy"
* Now we need a role that has this policy attached. In the left menu, select "Roles"
* Hit "Create New Role" and enter LambdaDynamoDBAccess as Role Name
* In the "Select Role Type" window, select "AWS Lambda" from the "Service Roles"
* In the "Select Policies" window select our "AllowDynamoDBAccessAndLogs" policy. Hit "Next Step", and on the review page select "Create Role".

####set up the function

* Select "Lambda" from services
* Make sure you are still in your preferred region (top right corner of screen)
* Create a new function with "Get Started Now" resp. "Create function"
* select "Blank function" as blueprint
* Hit "Next" on the triggers page
* Enter "SavegameAPIHandler" as function name
* Make sure Runtime is set to "Nodejs 4.3"
* Change "Code entry type" to "upload a zip file"
* Upload the archive you find in the repo under lambda/lambda.zip
* On the Role select box pick "Choose an existing role" and select the "LambdaDynamoDBAccess" role we created above
* Set timeout to 10 seconds
* Hit "Next" and on the review page "Create function"
* Copy your function ARN - it is shown on the top right on the screen after your lambda function was created

[more info](http://slin.cloud/how-to-set-up-a-serverless-scalable-backend-without-hosting-costs-part-3-the-lambda-function/)

###API Gateway
* Open the APIGateway.yaml (or the APIGateway_CORSenabled.yaml if you need CORS) from the repository in any editor
* find the places where the API gets mapped to your lambda. They read ```uri: "arn:aws:apigateway:_AWS_REGION_:lambda:path/2015-03-31/functions/_LAMBDA_FUNCTION_ARN_/invocations"``` and there are three of them.
* replace ``_AWS_REGION_`` with the region code you use, and ``_LAMBDA_FUNCTION_ARN_`` with your copied ARN. It will end up looking like this: ``uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:1234567890:function:SavegameAPIHandler/invocations`` when 1234567890 is your account number and your region is North Virginia (us-east-1)
* Then copy the whole thing and open the API Gateway console (select API Gateway from services)
* Click the "Get Started" button (If you already have APIs set up, the button will show "Create new API" instead)
* Under "Create new API" select "Import from Swagger" and paste the definition into the box
* Select your API, make sure you are in "resources" in the left menu. Select the POST method under the /register resource, and then "Integration Request".
* Click the icon for editing the lambda function name, then save it again without changing. This will fix missing permissions for the API Gateway resource.
* Repeat this for the other 2 methods in the /users resource.
* Select "Actions" / Deploy API" from the Dropdown button
* Select "[New Stage]" and enter "prod" as Stage Name
* Note your "Invoke URL" shown after you deployed the API.
