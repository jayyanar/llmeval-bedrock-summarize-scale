import json
import boto3
import uuid
import os
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
model_result_table = dynamodb.Table(os.environ['MODEL_RESULT_TABLE'])
run_status_table = dynamodb.Table(os.environ['RUN_STATUS_TABLE'])
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
bedrock_client = boto3.client('bedrock', region_name='us-east-1')

MODEL_PARAMS = {
    'max_tokens': 512,
    'temperature': 0,
    'top_p': 1,
    'top_k': 250,
    'stop_sequences': []
}


def get_model_config(model_id, template):
    base_config = {
        "max_tokens": MODEL_PARAMS['max_tokens'],
        "temperature": MODEL_PARAMS['temperature'],
        "top_p": MODEL_PARAMS['top_p'],
        "top_k": MODEL_PARAMS['top_k'],
        "stop_sequences": MODEL_PARAMS['stop_sequences']
    }
    
    if model_id.startswith("anthropic.claude-v2") or model_id.startswith("anthropic.claude-instant-v1"):
        return json.dumps({
            "prompt": f"\n\nHuman: {template}\n\nAssistant:",
            "max_tokens_to_sample": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "top_p": base_config['top_p'],
            "top_k": base_config['top_k'],
            "stop_sequences": base_config['stop_sequences'] + ["\n\nHuman:"]
        })
    elif model_id.startswith("anthropic.claude-3"):
        return json.dumps({
            "messages": [{"role": "user", "content": template}],
            "max_tokens": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "top_p": base_config['top_p'],
            "top_k": base_config['top_k'],
            "anthropic_version": "bedrock-2023-05-31"
        })
    elif model_id.startswith("cohere.command-text"):
        return json.dumps({
            "prompt": template,
            "max_tokens": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "p": base_config['top_p'],
            "k": base_config['top_k'],
            "stop_sequences": base_config['stop_sequences'],
            "return_likelihoods": "NONE"
        })
    elif model_id.startswith("cohere.command-r"):
        return json.dumps({
            "message": template,
            "max_tokens": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "p": base_config['top_p'],
            "k": base_config['top_k'],
            "stop_sequences": base_config['stop_sequences']
        })
    elif model_id.startswith("ai21.j2"):
        return json.dumps({
            "prompt": template,
            "maxTokens": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "topP": base_config['top_p'],
            "stopSequences": base_config['stop_sequences'],
            "countPenalty": {"scale": 0},
            "presencePenalty": {"scale": 0},
            "frequencyPenalty": {"scale": 0}
        })
    elif model_id.startswith("meta.llama3"):
        return json.dumps({
            "prompt": f"Human: {template}\nAssistant:",
            "max_gen_len": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "top_p": base_config['top_p']
        })
    elif model_id.startswith("mistral"):
        return json.dumps({
            "prompt": f"<s>[INST] {template} [/INST]",
            "max_tokens": base_config['max_tokens'],
            "temperature": base_config['temperature'],
            "top_p": base_config['top_p']
        })
    elif model_id.startswith("amazon.titan"):
        return json.dumps({
            "inputText": template,
            "textGenerationConfig": {
                "maxTokenCount": base_config['max_tokens'],
                "temperature": base_config['temperature'],
                "topP": base_config['top_p'],
                "stopSequences": base_config['stop_sequences']
            }
        })
    else:
        raise ValueError(f"Unsupported model: {model_id}")

def extract_response(model_id, response_body):
    if model_id.startswith("anthropic.claude-v2") or model_id.startswith("anthropic.claude-instant-v1"):
        return response_body.get('completion', '')
    elif model_id.startswith("anthropic.claude-3"):
        return response_body.get('content', [{}])[0].get('text', '')
    elif model_id.startswith("cohere."):
        return response_body.get('text', '') if model_id.startswith("cohere.command-text") else response_body.get('generations', [{}])[0].get('text', '')
    elif model_id.startswith("ai21."):
        return response_body.get('completions', [{}])[0].get('data', {}).get('text', '')
    elif model_id.startswith("meta."):
        return response_body.get('generation', '')
    elif model_id.startswith("mistral."):
        return response_body.get('outputs', [{}])[0].get('text', '')
    elif model_id.startswith("amazon.titan"):
        return response_body.get('results', [{}])[0].get('outputText', '')
    else:
        raise ValueError(f"Unsupported model for response extraction: {model_id}")

def update_run_status(run_id, status):
    try:
        run_status_table.put_item(
            Item={
                'RunID': run_id,
                'Status': status
            }
        )
    except ClientError as e:
        print(f"Error updating Run-Status table: {e.response['Error']['Message']}")
        raise

def get_inference_config(model_id, s3_uri):
    return {
        "bedrockModel": {
            "modelIdentifier": model_id,
            "inferenceParams": json.dumps({
                "maxTokens": MODEL_PARAMS['max_tokens'],
                "temperature": MODEL_PARAMS['temperature'],
                "topP": MODEL_PARAMS['top_p'],
                "stopSequences": MODEL_PARAMS['stop_sequences']
            })
        }
    }

def get_supported_metrics(model_id):
    # Define supported metrics for each model family
    metrics = {
        "anthropic": ["Builtin.Accuracy", "Builtin.Robustness", "Builtin.Toxicity"],
        "amazon": ["Builtin.Accuracy", "Builtin.Robustness", "Builtin.Toxicity"],
        "cohere": ["Builtin.Accuracy", "Builtin.Robustness"],
        "ai21": ["Builtin.Accuracy", "Builtin.Robustness"],
        "meta": ["Builtin.Accuracy", "Builtin.Robustness"],
        "mistral": ["Builtin.Accuracy", "Builtin.Robustness"]
    }
    
    for family, supported_metrics in metrics.items():
        if model_id.startswith(family):
            return supported_metrics
    
    return ["Builtin.Accuracy", "Builtin.Robustness"]

def lambda_handler(event, context):
    headers = {
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    user_context = event.get("Context", "Default context")
    run_id = event.get("RunID", str(uuid.uuid4()))
    eval_model = event.get("eval_model", "anthropic.claude-3-sonnet-20240229-v1:0")
    model_key = "model1"
    model_id = event.get(model_key)
    
    if model_id is None:
        raise ValueError(f"Model ID not provided in the event for key: {model_key}")
        
    category = event.get("Category", "default_category")
    
    if "ModelParams" in event:
        MODEL_PARAMS.update(event["ModelParams"])

    try:
        update_run_status(run_id, "Running")
        
        template = f"summarise the content as follows: {user_context}"
        
        body = get_model_config(model_id, template)

        response = bedrock_runtime.invoke_model(
            body=body,
            modelId=model_id,
            accept='application/json',
            contentType='application/json'
        )

        response_body = json.loads(response.get('body').read())
        response_text = extract_response(model_id, response_body)

        jsonl_content = json.dumps({
            "prompt": user_context,
            "referenceResponse": response_text,
            "category": category
        }) + "\n"

        bucket_name = 'input-datas-directory'
        file_name = f"{run_id}_{model_key}.jsonl"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=jsonl_content
        )

        s3_uri = f"s3://{bucket_name}/{file_name}"

        job_name = f"summ-eval-{str(uuid.uuid4())[:8]}"
        role_arn = os.environ['ROLE_ARN']
        
        supported_metrics = get_supported_metrics(model_id)
        
        evaluation_config = {
            "automated": {
                "datasetMetricConfigs": [
                    {
                        "taskType": "Summarization",
                        "dataset": {
                            "name": "CustomDataset",
                            "datasetLocation": {
                                "s3Uri": s3_uri
                            }
                        },
                        "metricNames": supported_metrics
                    }
                ]
            }
        }

        inference_config = {
            "models": [get_inference_config(model_id, s3_uri)]
        }

        output_data_config = {
            "s3Uri": f"s3://outputs-data-directory/{run_id}_{model_key}/"
        }

        response = bedrock_client.create_evaluation_job(
            jobName=job_name,
            roleArn=role_arn,
            evaluationConfig=evaluation_config,
            inferenceConfig=inference_config,
            outputDataConfig=output_data_config
        )
        job_arn = response['jobArn']
        try:
            existing_item = model_result_table.get_item(Key={'RunID': run_id}).get('Item', {})
        except ClientError as e:
            print(f"Error fetching item from DynamoDB: {e.response['Error']['Message']}")
            existing_item = {}

        update_expression = f"SET {model_key} = :val, Context = :context"
        expression_attribute_values = {
            ':val': {'ModelName': model_id, 'ARN': job_arn},
            ':context': user_context
        }
        
        for key in ['Model1', 'Model2', 'Model3']:
            if key != model_key and key in existing_item:
                update_expression += f", {key} = :{key}"
                expression_attribute_values[f':{key}'] = existing_item[key]
        
        model_result_table.update_item(
            Key={'RunID': run_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

        update_run_status(run_id, "Running")

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({ 'RunID': run_id, 'Model': model_key, 'jobArn': job_arn, 's3Uri': s3_uri})
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        update_run_status(run_id, "Failed")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }