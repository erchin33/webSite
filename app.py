from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import json
import uuid

# Load environment variables from .env file
load_dotenv(override=True)  # Force reload of environment variables

# Debug: Print current working directory and .env file existence
print(f"Current working directory: {os.getcwd()}")
print(f".env file exists: {os.path.exists('.env')}")

# Get API key and verify it exists
api_key = os.getenv('OPENAI_API_KEY')
print(f"API Key loaded (first 8 chars): {api_key[:8] if api_key else 'None'}")

if not api_key:
    raise ValueError("No OpenAI API key found. Please set OPENAI_API_KEY in .env file")

app = Flask(__name__, static_folder='client/build')
CORS(app)

# Initialize OpenAI client with explicit API key
client = OpenAI(
    api_key=api_key,
    base_url="https://api.openai.com/v1"  # Explicitly set the base URL
)

# Veri dosyaları
PRODUCTS_FILE = 'data/products.json'
TRAINING_FILE = 'data/training.json'
RULES_FILE = 'data/rules.json'

# Default rules definition
default_rules_list = [
    "Sen bir sağlık takviyesi bilgi danışmanısın. Görevin kullanıcıların yüklediği tıbbi raporları inceleyerek, rapordaki verilere dayanarak sadece aşağıdaki ürünler arasından ilgili olabilecek ürünler hakkında bilgi vermektir.", # Main system message part
    "Kişilik, Davranış Kuralları ve Yanıt Stili ayarlarını dikkate al.", # Instruction for training data
    "Sadece aşağıdaki ürünler hakkında bilgi ver:", # Rule for allowed products
    "Kullanıcının yüklediği tıbbi raporu analiz et.",
    "Rapordaki önemli verileri (örneğin, vitamin/mineral eksiklikleri, belirli durumlarla ilgili bulgular) belirle.",
    "Belirlediğin verilere dayanarak, sadece mevcut ürünler listesinden hangi ürünlerin ilgili olabileceği hakkında bilgi ver.",
    "Kesinlikle tıbbi teşhis koyma, tedavi önerme veya doğrudan takviye kullanımı için yönlendirme yapma.",
    "Sadece ürünlerin içeriği, potansiyel faydaları (genel bilgi düzeyinde) ve kullanım şekilleri gibi bilgileri, rapordaki verilere *dayandırarak* sun.",
    "Herhangi bir sağlık sorunu veya ilaç kullanımı durumunda mutlaka doktora danışılması gerektiğini tekrar vurgula.",
    "Yanıtına rapordaki analiziyle ilgili genel bir giriş cümlesiyle başla ve ardından ilgili ürün bilgilerini listeleyerek sun.",
    "Her ürün bilgisi için aşağıdaki formatı kullan:\n   📌 [Ürün Adı] Hakkında Bilgi\n   🟢 Ürün Adı: [Ürün adı]\n   🧪 İçerik: [Ürün içeriği]\n   💊 Kullanım Şekli: [Ürün üzerindeki talimatlar veya genel kullanım bilgisi]\n   💡 İlgili Olabilecek Alanlar (Rapora Göre): [Rapordaki hangi veriye dayanarak bu ürünün ilgili olabileceği bilgisini belirt]\n\n   ⚠️ Önemli Notlar:\n   Bu bilgi tedavi amaçlı değil, destekleyici amaçlıdır.\n   Kullanmadan önce doktorunuza danışın.\n   İlaç kullanıyorsanız veya kronik hastalığınız varsa mutlaka hekiminize danışın.\n\n   📸 Görsel: [Ürün görseli URL'si]",
    "Cevaplarını Türkçe ver.",
    "Robot gibi değil, daha samimi ve yardımsever bir sohbet tonu kullan.",
    "Kısa ve öz cevaplar ver."
]

# Helper function to write rules to file
def write_rules_file(rules_list):
    try:
        json_output = json.dumps(rules_list, indent=2, ensure_ascii=False).encode('utf-8')
        with open(RULES_FILE, 'wb') as f:
            f.write(json_output)
        print(f"INFO: Rules successfully written to {RULES_FILE}")
    except Exception as e:
        print(f"ERROR: Could not write rules to {RULES_FILE}: {e}")

# Helper function to read rules from file
def read_rules_file():
    if not os.path.exists(RULES_FILE):
        print(f"INFO: {RULES_FILE} not found.")
        return None
    try:
        with open(RULES_FILE, 'rb') as f: # Read in binary mode
            rules = json.load(f)
        if not isinstance(rules, list):
            print(f"Warning: {RULES_FILE} does not contain a list ({type(rules).__name__}).")
            return None
        print(f"INFO: {RULES_FILE} loaded successfully.")
        return rules
    except (json.JSONDecodeError, Exception) as e:
        print(f"ERROR: Could not read or decode {RULES_FILE}: {e}")
        return None

# Veri dosyalarını oluştur veya kontrol et
os.makedirs('data', exist_ok=True)

# products.json kontrolü (UTF-8 eklenmiş)
if not os.path.exists(PRODUCTS_FILE):
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

# training.json kontrolü (UTF-8 eklenmiş)
if not os.path.exists(TRAINING_FILE):
    with open(TRAINING_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            'personality': '',
            'behavior': '',
            'responseStyle': ''
        }, f)

# rules.json kontrolü ve oluşturma/onarma (basitleştirildi)
def ensure_rules_file_on_startup():
    loaded_rules = read_rules_file()
    if loaded_rules is None:
        print("INFO: Ensuring rules file with default rules due to read failure or absence.")
        write_rules_file(default_rules_list)
        # Attempt to read again to ensure it's valid for the first request
        loaded_rules = read_rules_file() # This should now succeed if writing worked
        if loaded_rules is None:
            print("CRITICAL ERROR: Failed to read rules file even after writing defaults.")
            # Fallback: use default_rules_list directly in get_ai_response if reading fails
            pass # get_ai_response will handle the None case

# Uygulama başlangıcında rules dosyasını kontrol et/oluştur/onar
ensure_rules_file_on_startup()

def get_ai_response(message=None, image_data=None):
    try:
        # Eğitim verilerini yükle
        with open(TRAINING_FILE, 'r', encoding='utf-8') as f:
            training_data = json.load(f)

        # Ürünleri yükle
        with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
            products = json.load(f)

        # Kuralları yükle (hata durumunda None dönebilir)
        rules = read_rules_file()
        # read_rules_file None dönerse default listeyi kullan
        if rules is None:
            print("Warning: Could not read rules file, using default rules list for AI response.")
            rules_to_use = default_rules_list
        else:
            rules_to_use = rules

        # AI sistem mesajını oluştur
        # İlk iki kural sistem mesajının ana kısmını ve training data talimatını oluşturur.
        # Kalan kurallar numaralandırılmış listeye eklenir.
        system_intro_part = rules_to_use[0] if len(rules_to_use) > 0 else ""
        training_data_instruction = rules_to_use[1] if len(rules_to_use) > 1 else ""
        numbered_rules_content = rules_to_use[2:] if len(rules_to_use) > 2 else []

        rules_text = "\n".join([f"{i+1}. {rule}" for i, rule in enumerate(numbered_rules_content)])

        system_message_content = f"""{system_intro_part}\n\n{training_data_instruction}\n\nKişilik: {training_data['personality']}\nDav davranış Kuralları: {training_data['behavior']}\nYanıt Stili: {training_data['responseStyle']}\n\nKurallar:\n{rules_text}\n\nÜrünler:\n{json.dumps(products, indent=2, ensure_ascii=False)}
"""

        messages = [
            {
                "role": "system",
                "content": system_message_content
            }
        ]

        if image_data:
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Bu tıbbi raporu analiz et ve besin takviyesi hakkında bilgi ver."
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

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as api_error:
            print(f"OpenAI API Error: {str(api_error)}")
            return f"API Hatası: {str(api_error)}"

    except Exception as e:
        print(f"Error in get_ai_response: {str(e)}")
        return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin."

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
            products = json.load(f)
        return jsonify(products)
    except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
        print(f"Error reading {PRODUCTS_FILE}: {str(e)}")
        return jsonify([]), 200

@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        product = request.get_json()
        product['id'] = str(uuid.uuid4())  # Benzersiz ID ekle
        # Read existing products with error handling
        try:
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                products = json.load(f)
            if not isinstance(products, list):
                 products = [] # Reset if not a list
        except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
            print(f"Warning: Could not read existing {PRODUCTS_FILE} for adding: {e}. Starting with empty list.")
            products = []

        products.append(product)
        with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        return jsonify({"message": "Ürün başarıyla eklendi", "product": product})
    except Exception as e:
        print(f"Error adding product to {PRODUCTS_FILE}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        updated_product = request.get_json()
        # Read existing products with error handling
        try:
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                products = json.load(f)
            if not isinstance(products, list):
                 products = [] # Reset if not a list
        except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
            print(f"Warning: Could not read existing {PRODUCTS_FILE} for updating: {e}. Cannot update product.")
            return jsonify({"error": "Ürünler yüklenemedi"}), 500 # Cannot update if cannot read

        found = False
        for i, product in enumerate(products):
            if product['id'] == product_id:
                updated_product['id'] = product_id # Ensure ID is preserved
                products[i] = updated_product
                found = True
                break

        if found:
            with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2, ensure_ascii=False)
            return jsonify({"message": "Ürün başarıyla güncellendi", "product": updated_product})
        
        return jsonify({"error": "Ürün bulunamadı"}), 404
    except Exception as e:
        print(f"Error updating product in {PRODUCTS_FILE}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        # Read existing products with error handling
        try:
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                products = json.load(f)
            if not isinstance(products, list):
                 products = [] # Reset if not a list
        except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
            print(f"Warning: Could not read existing {PRODUCTS_FILE} for deleting: {e}. Cannot delete product.")
            return jsonify({"error": "Ürünler yüklenemedi"}), 500 # Cannot delete if cannot read

        original_count = len(products)
        products = [p for p in products if p['id'] != product_id]
        
        if len(products) < original_count:
             with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                 json.dump(products, f, indent=2, ensure_ascii=False)
             return jsonify({"message": "Ürün başarıyla silindi"})
        else:
             return jsonify({"error": "Ürün bulunamadı"}), 404
             
    except Exception as e:
        print(f"Error deleting product from {PRODUCTS_FILE}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/training', methods=['GET'])
def get_training():
    try:
        # Dosyanın varlığını ve boş olup olmadığını kontrol et
        if not os.path.exists(TRAINING_FILE) or os.stat(TRAINING_FILE).st_size == 0:
            print(f"{TRAINING_FILE} does not exist or is empty. Returning default training data.")
            # Return a default structure if file is missing or empty
            return jsonify({
                'personality': '',
                'behavior': '',
                'responseStyle': ''
            }), 200

        with open(TRAINING_FILE, 'r', encoding='utf-8') as f:
            training_data = json.load(f)

        # Yüklenen verinin beklenen formatta olup olmadığını kontrol et
        if not isinstance(training_data, dict) or not all(k in training_data for k in ['personality', 'behavior', 'responseStyle']):
             print(f"Warning: {TRAINING_FILE} does not contain expected training data format. Returning default.")
             return jsonify({
                'personality': '',
                'behavior': '',
                'responseStyle': ''
            }), 200

        return jsonify(training_data)
    except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
        print(f"Error reading {TRAINING_FILE}: {str(e)}")
        # Hata durumunda varsayılan veriyi döndürelim
        return jsonify({
            'personality': '',
            'behavior': '',
            'responseStyle': ''
        }), 200

@app.route('/api/training', methods=['POST'])
def update_training():
    try:
        training_data = request.get_json()
         # Validate incoming data format
        if not isinstance(training_data, dict) or not all(k in training_data for k in ['personality', 'behavior', 'responseStyle']):
             return jsonify({"error": "Invalid training data format"}), 400

        with open(TRAINING_FILE, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2, ensure_ascii=False)
        return jsonify({"message": "Eğitim verileri başarıyla güncellendi"})
    except Exception as e:
        print(f"Error updating {TRAINING_FILE}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rules', methods=['GET'])
def get_rules():
    # Bu endpoint artık doğrudan dosyayı okuyup döndürüyor, hata yönetimi read_rules_file içinde
    rules = read_rules_file()
    if rules is None:
        # read_rules_file hata durumunda None döner, boş liste döndürelim
        return jsonify([]), 200 # Return 200 even on read error to avoid frontend crash
    return jsonify(rules)

@app.route('/api/rules', methods=['POST'])
def update_rules():
    try:
        rules = request.get_json()
         # Validate incoming data format - should be a list
        if not isinstance(rules, list):
             return jsonify({"error": "Invalid rules data format - expected a list"}), 400
             
        write_rules_file(rules) # Use the helper function to write
        return jsonify({"message": "Kurallar başarıyla güncellendi"})
    except Exception as e:
        print(f"Error updating {RULES_FILE}: {str(e)}")
        return jsonify({"error": str(e)}), 500


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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        # API rotaları artık doğrudan tanımlı
        pass
    elif path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        # React uygulamasını serve et
        return send_from_directory(app.static_folder, 'index.html')

# handle_api_request fonksiyonu artık kullanılmıyor
# def handle_api_request(endpoint):
#     pass

if __name__ == '__main__':
    app.run(debug=True) 