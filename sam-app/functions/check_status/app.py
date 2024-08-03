import json
import boto3
import os
from botocore.exceptions import ClientError

bedrock_client = boto3.client('bedrock', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')
s3_client = boto3.client('s3')

MODEL_RESULT_TABLE = os.environ['MODEL_RESULT_TABLE']
RUN_STATUS_TABLE = os.environ['RUN_STATUS_TABLE']

def lambda_handler(event, context):
    run_id = event['RunID']
    model_key = event['Model']  
    
    try:
        job_arn, full_model_name = get_job_arn_and_model_from_dynamodb(run_id, model_key)
        
        if not job_arn:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Job ARN not found in DynamoDB'})
            }
        
        job_status, s3_uri = get_evaluation_job_status(job_arn)
        
        if job_status == 'Completed':
            results = process_evaluation_results(job_arn, s3_uri)
            
            update_dynamodb_with_results(run_id, model_key, full_model_name, results)
            
            update_run_status(run_id)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'Completed',
                    'results': results
                })
            }
        elif job_status in ['Failed', 'Stopped']:
            update_run_status(run_id, job_status)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': job_status,
                    'error': 'Evaluation job failed or was stopped'
                })
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'In Progress',
                    'message': f'Evaluation job is still {job_status}'
                })
            }
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def get_job_arn_and_model_from_dynamodb(run_id, model_key):
    try:
        response = dynamodb.get_item(
            TableName=MODEL_RESULT_TABLE,
            Key={'RunID': {'S': run_id}}
        )
        item = response.get('Item', {})
        
        model_data = item.get(model_key, {}).get('M', {})
        job_arn = model_data.get('ARN', {}).get('S')
        full_model_name = model_data.get('ModelName', {}).get('S')
        
        return job_arn, full_model_name
    except ClientError as e:
        print(f"Error retrieving job ARN from DynamoDB: {e.response['Error']['Message']}")
        raise

def get_evaluation_job_status(job_arn):
    try:
        response = bedrock_client.get_evaluation_job(jobIdentifier=job_arn)
        return response['status'], response['outputDataConfig']['s3Uri']
    except ClientError as e:
        print(f"Error getting evaluation job status: {e.response['Error']['Message']}")
        raise

def process_evaluation_results(job_arn, base_s3_uri):
    try:
        response = bedrock_client.get_evaluation_job(jobIdentifier=job_arn)
        job_name = response['jobName']
        model_identifier = response['inferenceConfig']['models'][0]['bedrockModel']['modelIdentifier']
        
        s3_uri = f"{base_s3_uri}{job_name}/{job_arn.split('/')[-1]}/models/{model_identifier}/taskTypes/Summarization/datasets/CustomDataset/"
        
        bucket_name, key_prefix = parse_s3_uri(s3_uri)
        
        objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=key_prefix)
        
        for obj in objects.get('Contents', []):
            if obj['Key'].endswith('.jsonl'):
                response = s3_client.get_object(Bucket=bucket_name, Key=obj['Key'])
                content = response['Body'].read().decode('utf-8')
                
                results = process_jsonl_content(content)
                return results
        
        raise Exception("No JSONL file found in the S3 bucket")
    
    except ClientError as e:
        print(f"Error processing evaluation results: {e.response['Error']['Message']}")
        raise

def parse_s3_uri(s3_uri):
    parts = s3_uri.replace("s3://", "").split("/")
    bucket_name = parts[0]
    key_prefix = "/".join(parts[1:])
    return bucket_name, key_prefix

def process_jsonl_content(content):
    lines = content.strip().split('\n')
    for line in lines:
        data = json.loads(line)
        automated_result = data.get('automatedEvaluationResult', {})
        scores = automated_result.get('scores', [])
        
        results = {
            'Accuracy': {'S': str(next((score['result'] for score in scores if score['metricName'] == 'Accuracy'), ''))},
            'Robustness': {'S': str(next((score['result'] for score in scores if score['metricName'] == 'Robustness'), ''))},
            'Toxicity': {'S': str(next((score['result'] for score in scores if score['metricName'] == 'Toxicity'), ''))},
            'Summary': {'S': data.get('inputRecord', {}).get('referenceResponse', '')}
        }
        
        return results
    
    raise Exception("No valid data found in the JSONL content")

def update_dynamodb_with_results(run_id, model_key, full_model_name, results):
    try:
        response = dynamodb.get_item(
            TableName=MODEL_RESULT_TABLE,
            Key={'RunID': {'S': run_id}}
        )
        item = response.get('Item', {})
        
        model_data = item.get(model_key, {'M': {}})['M']
        model_data.update(results)
        model_data['ModelName'] = {'S': full_model_name}
        item[model_key] = {'M': model_data}
        
        item[full_model_name] = {'M': model_data}
        
        dynamodb.put_item(
            TableName=MODEL_RESULT_TABLE,
            Item=item
        )
    except ClientError as e:
        print(f"Error updating DynamoDB with results: {e.response['Error']['Message']}")
        raise

def update_run_status(run_id, status=None):
    try:
        if status is None:
            response = dynamodb.get_item(
                TableName=MODEL_RESULT_TABLE,
                Key={'RunID': {'S': run_id}}
            )
            item = response.get('Item', {})
            
            all_completed = all(
                'Accuracy' in item.get(model, {}).get('M', {})
                for model in ['model1', 'model2', 'model3']
            )
            
            status = 'Completed' if all_completed else 'Running'
        
        dynamodb.put_item(
            TableName=RUN_STATUS_TABLE,
            Item={
                'RunID': {'S': run_id},
                'Status': {'S': status}
            }
        )
    except ClientError as e:
        print(f"Error updating Run-Status table: {e.response['Error']['Message']}")
        raise