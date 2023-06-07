import json
import boto3
import os
import decimal
from boto3.dynamodb.conditions import Attr

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('a2-image-detected')
def lambda_handler(event, context):
    body = json.loads(event['body'])
    user_id = body['user_id']
    
    # Perform a full table scan
    response = table.scan(
        FilterExpression=Attr('user_id').eq(user_id)
    )
    items = response['Items']

    # Create a list to store the presigned URLs, tags and counts
    result = []
    for item in items:
        s3_url = item['s3_url']
        bucket_name = 'a3-image'
        object_key = item['s3_url'].split("https://a3-image.s3.amazonaws.com/")[1]
        url = generate_presigned_url(bucket_name, object_key)
        
        # Get tags and counts
        tags = item['tags']

        # Append url, tags and counts to the result list
        result.append({
            'url': url,
            'tags': tags
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'images': result}, cls=DecimalEncoder)
    }
    
def generate_presigned_url(bucket_name, object_key, expiration=600):
    try:
        response = s3.generate_presigned_url('get_object',
                                             Params={'Bucket': bucket_name,
                                                     'Key': object_key},
                                             ExpiresIn=expiration)
    except Exception as e:
        print("Error generating presigned URL: ", str(e))
        return str(e)

    return response
    
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)
