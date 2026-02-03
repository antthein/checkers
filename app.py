import sqlite3
import os
from flask import Flask, render_template, jsonify, request, g

app = Flask(__name__)
DB_PATH = 'checkers.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                winner_name TEXT NOT NULL,
                mode TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        db.commit()

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/play')
def play():
    return render_template('index.html')

@app.route('/api/save_game', methods=['POST'])
def save_game():
    data = request.json
    winner_name = data.get('winner')
    mode = data.get('mode')
    
    if not winner_name or not mode:
        return jsonify({'error': 'Invalid data'}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute('INSERT INTO games (winner_name, mode) VALUES (?, ?)', (winner_name, mode))
    db.commit()
    
    return jsonify({'message': 'Game saved successfully', 'id': cursor.lastrowid})

@app.route('/api/history')
def history():
    db = get_db()
    cursor = db.cursor()
    # Get last 10 games, newest first
    cursor.execute('SELECT * FROM games ORDER BY timestamp DESC LIMIT 10')
    games = [dict(row) for row in cursor.fetchall()]
    return jsonify(games)

if __name__ == '__main__':
    # Ensure DB exists before execution
    if not os.path.exists(DB_PATH):
        init_db()
    app.run(debug=True)
