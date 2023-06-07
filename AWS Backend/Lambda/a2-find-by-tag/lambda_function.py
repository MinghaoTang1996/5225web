import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = 'a2-image-detected'
table = dynamodb.Table(TABLE_NAME)
s3 = boto3.client('s3')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    tags_to_search = body['tags']
    user_id = body['user_id']
    
    # Perform a full table scan
    response = table.scan(
        FilterExpression=Attr('user_id').eq(user_id)
    )
    items = response['Items']

    # Filter out items that do not match our tags
    urls = []
    for item in items:
        tags = {tag['tag']: tag['count'] for tag in item['tags']}
        if all(tags.get(tag_item['tag'], 0) >= tag_item.get('count', 1) for tag_item in tags_to_search):
            # Generate presigned URL and append it to the list
            print(item)
            bucket_name = 'a3-image' 
            object_key = item['s3_url'].split("https://a3-image.s3.amazonaws.com/")[1] 
            url = generate_presigned_url(bucket_name, object_key)
            if url:
                urls.append(url)


    return {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Origin':'*'},
        'body': json.dumps({
            'links': urls
        })
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
