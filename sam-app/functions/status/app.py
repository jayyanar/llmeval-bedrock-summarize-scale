import json
import boto3
import os
from botocore.exceptions import ClientError

dynamodb = boto3.client('dynamodb')
RUN_STATUS_TABLE = os.environ['RUN_STATUS_TABLE']

def lambda_handler(event, context):
    table_name = RUN_STATUS_TABLE
    
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
        'headers': {
            'Content-Type': 'application/json'
        }
    }

def query_run_status(run_id):
    try:
        response = dynamodb.get_item(
            TableName=RUN_STATUS_TABLE,
            Key={'RunID': {'S': run_id}}
        )
        item = response.get('Item', {})
        return item.get('Status', {}).get('S', 'Unknown')
    except ClientError as e:
        print(f"Error querying Run-Status table: {e.response['Error']['Message']}")
        raise

def list_all_run_statuses():
    try:
        response = dynamodb.scan(
            TableName=RUN_STATUS_TABLE,
            ProjectionExpression='RunID, #S',
            ExpressionAttributeNames={'#S': 'Status'}
        )
        items = response.get('Items', [])
        return [{'RunID': item['RunID']['S'], 'Status': item['Status']['S']} for item in items]
    except ClientError as e:
        print(f"Error scanning Run-Status table: {e.response['Error']['Message']}")
        raise