import json
import boto3
import base64
import object_detection
from boto3.dynamodb.conditions import Attr

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

TABLE_NAME = 'a2-image-detected'

def lambda_handler(event, context):
    body = json.loads(event['body'])
    image_base64 = body['image']
    user_id = body['user_id']
    
    # Use object detection function
    tags = set(object_detection.detect_image(image_base64))
    
    # Search for matching images in DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    response = table.scan(
        FilterExpression=Attr('user_id').eq(user_id)
    )
    items = response['Items']
    
    urls = []
    for item in items:
        item_tags = set(tag['tag'] for tag in item['tags'])
        if tags.issubset(item_tags):  # check if all tags are in item_tags
            bucket_name = 'a3-image' 
            object_key = item['s3_url'].split("https://a3-image.s3.amazonaws.com/")[1] 
            url = generate_presigned_url(bucket_name, object_key)
            if url:
                urls.append(url)

    # Return the matching URLs
    return {
        'statusCode': 200,
        'body': json.dumps({
            'links': urls,
            'tags':list(tags)
        }),
        'headers':{'Access-Control-Allow-Origin':'*'}
    }
    
def generate_presigned_url(bucket_name, object_key, expiration=600):
    try:
        response = s3.generate_presigned_url('get_object',
                                             Params={'Bucket': bucket_name,
                                                     'Key': object_key},
                                             ExpiresIn=expiration)
    except Exception as e:
        print("Error generating presigned URL: ", e)
        return None

    return response