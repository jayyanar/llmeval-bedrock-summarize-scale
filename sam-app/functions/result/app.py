import boto3
import os
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['MODEL_RESULT_TABLE'])
    run_id = event['RunID']
    
    response = table.get_item(Key={'RunID': run_id})
    if 'Item' not in response:
        return {'error': 'RunID not found'}
    
    item = response['Item']
    result = {
        'RunID': run_id,
        'Content': item.get('Context', '')
    }
    
    for model_key in ['model1', 'model2', 'model3']:
        if model_key in item:
            model_data = item[model_key]
            
            result[model_key] = {
                'Model_id': model_data.get('ModelName', ''),
                'summary': model_data.get('Summary', ''),
                'robustness': model_data.get('Robustness', ''),
                'accuracy': model_data.get('Accuracy', ''),
                'toxicity': model_data.get('Toxicity', '')
            }
    
    return result