import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = 'a2-image-detected'
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    body = json.loads(event['body'])

    url = body['url']
    operation_type = body['type']
    tags = body['tags']
    
    # Use secondary index to find the item
    response = table.query(
        IndexName='s3_url-index',
        KeyConditionExpression=Key('s3_url').eq(url)
    )

    if response['Items']:
        item = response['Items'][0]  # Assuming s3_url is unique, we take the first item
        existing_tags = item.get('tags', [])
        
        for tag_item in tags:
            tag_name = tag_item['tag']
            tag_count = int(tag_item.get('count', 1))
            
            if operation_type == 1:  # Add tags
                for i in range(len(existing_tags)):
                    if existing_tags[i]['tag'] == tag_name:
                        existing_tags[i]['count'] = existing_tags[i]['count'] + Decimal(tag_count)
                        break
                else:
                    existing_tags.append({'count': Decimal(tag_count), 'tag': tag_name})

            elif operation_type == 0:  # Remove tags
                for i in range(len(existing_tags)):
                    if existing_tags[i]['tag'] == tag_name:
                        existing_tags[i]['count'] = existing_tags[i]['count'] - Decimal(tag_count)
                        if existing_tags[i]['count'] <= 0:
                            del existing_tags[i]
                        break

        # Update the item
        table.update_item(
            Key={'Date': item['Date']},
            UpdateExpression='SET tags = :tags',
            ExpressionAttributeValues={
                ':tags': existing_tags
            }
        )

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps('Tags updated successfully')
        }
    else:
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps('URL not found in the table')
        }

