import json
import sys

def clean_workflow(input_file, output_file):
    """Clean workflow JSON for n8n import"""
    with open(input_file, 'r') as f:
        workflow = json.load(f)
    
    # Remove tags (read-only field)
    if 'tags' in workflow:
        del workflow['tags']
    
    # Remove id fields (will be assigned by n8n)
    for node in workflow.get('nodes', []):
        if 'id' in node:
            del node['id']
    
    # Remove connection node IDs
    for source, connections in workflow.get('connections', {}).items():
        for conn_type, conn_list in connections.items():
            for conn_group in conn_list:
                for conn in conn_group:
                    if 'id' in conn:
                        del conn['id']
    
    with open(output_file, 'w') as f:
        json.dump(workflow, f, indent=2)
    
    print(f"Cleaned: {input_file} -> {output_file}")

if __name__ == '__main__':
    for filename in ['mimotes-chat', 'mimotes-upload', 'mimotes-search', 'mimotes-ocr']:
        clean_workflow(f'{filename}.json', f'{filename}-clean.json')
