*This document is for reproduce back-end*
## Lambda Function
- image-detection & find-by-image lambda functions need extra layers
- All trigger are mentioned in architecture diagram
- All lambda function code are in this folder, total 7 lambda functions
## DynamoDB
- Partition key: Date (String)
- Global secondary indexes: Name: s3_url-index, Partition key: s3_url (String)

- Table Overview

| Date | s3_url | tags | user_id |
| -----| ---- | ---- | ---- |
| 2023-06-06 14:52:38 | https://a3-image.s3.amazonaws.com/images/c73b5102047911ee86b92eaf19b32b63.png | [ { "M" : { "count" : { "N" : "3" }, "tag" : { "S" : "person" } } } ] | 06ef06c8-6500-45bb-af0c-8ddf8fc7fbc5 |
| 2023-06-06 10:04:04 | https://a3-image.s3.amazonaws.com/images/77c5e2ae045111ee9a1caaaa66001968.jpg | [ { "M" : { "count" : { "N" : "4" }, "tag" : { "S" : "motorbike" } } } ] | c60e1129-e6b5-4f43-803f-95287e91a210 |

## S3
- After creat a bucket *a3-image*, all images saved in a folder */images*
- Example of image path: Amazon S3, Buckets, a3-image, images/, 00695c3803aa11ee8d7cae8f22a453c3.jpg
- Example of Amazon Resource Name (ARN): arn:aws:s3:::a3-image/images/00695c3803aa11ee8d7cae8f22a453c3.jpg

## Cognito
- Cognito user pool sign-in options: User name, Email
- Required attributes: given_name, family_name, email
- App client: a2-image-detection
    - Allowed callback URLs: http://localhost:5000/html/main.html
    - Allowed sign-out URLs: http://localhost:5000/html/login.html
    - Identity providers: Cognito user pool directory, Google
    - OAuth grant types: Implicit grant
    - OpenID Connect scopes: email, openid

## API Gateway
- protocol: REST
- Must Enable CORS (**Important**)
- Authorizers: a2-authorizer
    - Authorizer ID:621qxw
    - Cognito User Pool: a2-image-detection - TDlc3Crig (us-east-1)
    - Token Source: Authorization
    - Token Validation: -
- All method:
    - Integration type: Lambda Function
    - Use Lambda Proxy integration: yes