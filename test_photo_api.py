import requests
import json

def get_token():
    url = "https://erp.ecopak.ca/Identity/connect/token"
    payload = {
        'grant_type': 'client_credentials',
        'client_id': 'QualipiecesPublicClient',
        'client_secret': 'NjuR!q]r3gM)WkHhvC=A;9'
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(url, data=payload, headers=headers)
    response.raise_for_status()
    return response.json()['access_token']

def test_has_photo(token):
    url = "https://erp.ecopak.ca/OrchestraQualipiecesApiTest/api/Items"
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    # Sort by photo non-null (photo?)
    params = {'Filter': 'photo!=', 'PageSize': 5}
    response = requests.get(url, headers=headers, params=params)
    try:
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching. Format might be wrong. Response body: {response.text}")
        return
        
    items = response.json()
    
    for item in items:
        if item.get('photo'):
            print(f"Found photo! Item: {item['itemNumber']}")
            print(f"Photo data: {str(item.get('photo'))[:100]}")
        else:
            print(f"Item {item['itemNumber']} has no photo.")
            
if __name__ == '__main__':
    token = get_token()
    test_has_photo(token)
