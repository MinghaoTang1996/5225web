import boto3
import json
from boto3.dynamodb.conditions import Key

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('a2-image-detected')

def lambda_handler(event, context):
    # Parse the body from the event
    body = event.get('body', None)
    if body is not None:
        body = json.loads(body)
    else:
        body = event

    url = body.get('url')
    if url is None:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing url parameter'})
        }

    # Parse bucket and key from the URL
    bucket = 'a3-image'
    key = url.split("https://a3-image.s3.amazonaws.com/")[1]

    # Delete the object from S3
    try:
        s3.delete_object(Bucket=bucket, Key=key)
    except s3.exceptions.NoSuchKey:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Image not found in S3'})
        }

    # Query the s3_url-index to get the primary key
    response = table.query(
        IndexName='s3_url-index',
        KeyConditionExpression=Key('s3_url').eq(url)
    )

    # Check if there is an item with the provided s3_url
    if response['Items']:
        item = response['Items'][0]
        primary_key = item['Date'] 

        # Delete the item from DynamoDB using the primary key
        table.delete_item(
            Key={
                'Date': primary_key 
            }
        )
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Image not found in DynamoDB'})
        }

    # Return a response
    return {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Origin':'*'},
        'body': json.dumps('Image successfully deleted')
    }
