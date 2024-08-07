import json
import boto3
import os

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Content-Type': 'application/json'
    }

    dynamodb = boto3.client('dynamodb')
    table_name = os.environ['MODEL_RESULT_TABLE']
    
    run_id = event.get('pathParameters', {}).get('runid', None)
    
    if run_id:
        response = dynamodb.get_item(
            TableName=table_name,
            Key={
                'RunID': {
                    'S': run_id
                }
            }
        )
        item = response.get('Item', {})
        run_id = item.get('RunID', {}).get('S', '')
        context_field = item.get('Context', {}).get('S', '')
        result = {
            'RunID': run_id,
            'Context': context_field
        }
    else:
        response = dynamodb.scan(
            TableName=table_name,
            ProjectionExpression='RunID, Context'
        )
        
        items = response.get('Items', [])
        result = [{'RunID': item['RunID']['S'], 'Context': item['Context']['S']} for item in items]
    
    return {
            'statusCode': 200,
            'body': json.dumps(result),
            'headers': headers
            }