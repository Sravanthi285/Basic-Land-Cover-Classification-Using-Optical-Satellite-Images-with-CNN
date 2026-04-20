from flask import Flask
from flask_cors import CORS
import routes

app = Flask(__name__)
# Enable CORS so the local frontend can talk to the local Flask server
CORS(app)

# Register our main endpoint
app.add_url_rule('/analyze', view_func=routes.analyze_location, methods=['POST'])

if __name__ == '__main__':
    print("Starting Land Use Classification API on port 5000...")
    app.run(debug=True, port=5000)
