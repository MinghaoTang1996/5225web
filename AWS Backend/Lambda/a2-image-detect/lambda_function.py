import json
import object_detection
import boto3
import os
from datetime import datetime, timezone
import time
import base64
from boto3.dynamodb.conditions import Key

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = 'a2-image-detected'

def lambda_handler(event, context):
    
    date = datetime.now(timezone.utc).astimezone().strftime('%Y-%m-%d %H:%M:%S')
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        image = s3_client.get_object(Bucket=bucket, Key=key)
        image_bytes = image["Body"].read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        tags = object_detection.detect_image(image_base64 )
        
        s3_url = "https://{}.s3.amazonaws.com/{}".format(bucket, key)
        
        table = dynamodb.Table(TABLE_NAME)
         # Query the GSI to get the primary key of the item
        response = table.query(
            IndexName='s3_url-index',
            KeyConditionExpression=Key('s3_url').eq(s3_url)
        )
        
        if response['Count'] > 0:
            # Get the primary key of the item
            primary_key = response['Items'][0]['Date']

            # Use the primary key to update the item
            update_response = table.update_item(
                Key={
                    'Date': primary_key
                },
                UpdateExpression="set tags=:t",
                ExpressionAttributeValues={
                    ':t': tags
                },
                ReturnValues="UPDATED_NEW"
            )
        
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
