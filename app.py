from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from openai import OpenAI
from dotenv import load_dotenv
import base64

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='client/build')
CORS(app)

# Initialize OpenAI client with API key from environment variable
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def get_ai_response(message=None, image_data=None):
    try:
        messages = [
            {
                "role": "system",
                "content": """Sen bir sağlık takviyesi danışmanısın. Görevin kullanıcıların şikayetlerine veya tıbbi raporlarına göre besin takviyesi önerilerinde bulunmaktır.

Kurallar:
1. Sadece besin takviyesi önerilerinde bulun
2. Her öneri için bilimsel kaynaklara dayalı açıklama yap
3. Önerilerini şu formatta sun:
   - Takviye adı
   - Günlük doz
   - Kullanım süresi
   - Beklenen faydalar
4. Her öneriden sonra doktora danışılması gerektiğini belirt
5. İlaç kullanan veya kronik hastalığı olan kişileri özellikle doktora yönlendir
6. Cevaplarını Türkçe ver
7. Kısa ve öz cevaplar ver"""
            }
        ]

        if image_data:
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Bu tıbbi raporu analiz et ve besin takviyesi önerilerinde bulun."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}",
                            "detail": "high"
                        }
                    }
                ]
            })
        elif message:
            messages.append({
                "role": "user",
                "content": message
            })

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=800
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Error in get_ai_response: {str(e)}")
        return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin."

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message')
        image_data = data.get('image')

        if not message and not image_data:
            return jsonify({"message": "Lütfen bir mesaj yazın veya bir görsel yükleyin."})

        response = get_ai_response(message, image_data)
        return jsonify({"message": response})

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"message": "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin."})

if __name__ == '__main__':
    app.run(debug=True) 