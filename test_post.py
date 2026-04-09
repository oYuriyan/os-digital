import urllib.request
import urllib.error
import json

body = json.dumps({
    'cliente_id': '75bdc974-87e1-405e-a6e6-6d05c4483167', 
    'tecnico_id': '1fc05084-99f7-4fd9-8cf9-0d27595931ab', 
    'tipo_servico': 'Manutenção', 
    'solicitante': 'Yuri', 
    'setor': 'TI', 
    'defeito_relatado': 'Teste'
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/os/', data=body, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error", e.code)
    print("Error body:", e.read().decode())
except Exception as e:
    print("Other error:", e)
