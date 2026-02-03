# CHECKERS GAME
#### Video Demo:  <URL HERE>
#### Description:

A modern, web-based implementation of the classic board game **Checkers**, built with **Python (Flask)**, **JavaScript**, and **SQLite**. This project features a polished **Glassmorphism UI**, 3D pieces, and a smart AI opponent.

## ✨ Features

- **🤖 Player vs AI**: Challenge a rule-based AI opponent.
- **👥 Player vs Player**: Local multiplayer support.
- **🌓 Dark/Light Mode**: Toggle between themes using a fluid Neumorphic slider.
- **🧠 Advanced Logic**:
  - Mandatory Captures (Forced Jumps).
  - Multi-jump (Double/Triple jump) support.
  - King Promotion.
- **↩️ Undo/Redo**: Mistake? Just undo your move (and the AI's response).
- **🎨 Modern UI**: Glassmorphism dashboard, 3D CSS pieces, and smooth animations.
- **💾 History Tracking**: Saves game results to a local SQLite database.

## 🛠️ Technology Stack

- **Backend**: Python (Flask)
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3 (Variables, Flexbox, Grid), JavaScript (ES6+)

---

## 🚀 Installation & Setup

Follow these steps to get the game running locally:

### 1. Prerequisites
Ensure you have **Python 3.x** installed. You can check by running:
```bash
python --version
```

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/checkers.git
cd checkers
```

### 3. Install Dependencies
It is recommended to use a virtual environment, but you can also install directly:
```bash
pip install -r requirements.txt
```
*(If you don't use the file, simply run `pip install flask`)*

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```
Or:
```bash
flask run
```

### 5. Play!
Open your browser and navigate to:
👉 **http://127.0.0.1:5000**

---

## 🎮 How to Play

1.  **Select Mode**: Choose "Player vs Player" or "Player vs AI" on the welcome screen.
2.  **Move**: Click a piece to select it, then click a highlighted dark square to move.
3.  **Capture**: If a jump is available, you **must** take it (standard rules).
4.  **Kings**: Reach the opponent's back row to become a King ♔ (move backwards & forwards).
5.  **Win**: Capture all enemy pieces or block them from moving.

## 📂 Project Structure

```
checkers/
├── app.py              # Flask application & database logic
├── checkers.db         # SQLite database (auto-created)
├── requirements.txt    # Python dependencies
├── static/
│   ├── game.js         # Core game logic (Movement, AI, Rules)
│   ├── style.css       # Game board & Glassmorphism styles
│   ├── welcome.css     # Welcome page specific styles
│   └── images/         # Assets (Backgrounds)
└── templates/
    ├── index.html      # Main game board interface
    └── welcome.html    # Landing page with mode selection
```

## 📜 License
This project was developed for **CS50's Introduction to Computer Science**.
