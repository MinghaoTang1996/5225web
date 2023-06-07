import json
import boto3
import base64
import os
import uuid
from datetime import datetime, timezone

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('a2-image-detected')
bucket = "a3-image"

def lambda_handler(event, context):
    if event['httpMethod'] == 'POST':
        data = json.loads(event['body'])
        name = data['name']
        user_id = data['user_id']
        
        _, suffix = os.path.splitext(name)
        
        image = data['file']
        id = uuid.uuid1()
        
        name = "images/" + str(id.hex) + suffix
        image_decoded = base64.b64decode(image)
        
        s3.put_object(Bucket='a3-image', Key=name, Body=image_decoded, ContentType='mimetype', ContentDisposition='inline')
        
        date = datetime.now(timezone.utc).astimezone().strftime('%Y-%m-%d %H:%M:%S')
        
        s3_url = "https://{}.s3.amazonaws.com/{}".format(bucket, name)
        table.put_item(
            Item={'Date':date, 's3_url':s3_url, 'user_id': user_id}
        )
        
        
        # TODO implement
        return {
            'statusCode': 200,
            'body': json.dumps({"name": name}),
            'headers':{'Access-Control-Allow-Origin':'*'}
        }
