from flask import Flask, request, jsonify, session, send_from_directory
from flask_mysqldb import MySQL
import hashlib
import os

app = Flask(__name__, static_folder='.')
app.secret_key = 'expenseiq_secret_key_2026'

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Mukesh1506'
app.config['MYSQL_DB'] = 'expenseiq'

mysql = MySQL(app)

# Helper: hash password 
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Serve frontend files
@app.route('/')
def index():
    if 'user_id' not in session:
        return send_from_directory('.', 'login.html')
    return send_from_directory('.', 'index.html')

@app.route('/login.html')
def login_page():
    return send_from_directory('.', 'login.html')

@app.route('/index.html')
def dashboard():
    return send_from_directory('.', 'index.html')

# ── AUTH ROUTES ──────────────────────────────────────────────────────────────

# Register
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = hash_password(data.get('password'))

    try:
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                    (username, email, password))
        mysql.connection.commit()
        cur.close()
        return jsonify({'success': True, 'message': 'Registered successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Email already exists'})

# Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = hash_password(data.get('password'))

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, username FROM users WHERE email=%s AND password=%s", (email, password))
    user = cur.fetchone()
    cur.close()

    if user:
        session['user_id'] = user[0]
        session['username'] = user[1]
        return jsonify({'success': True, 'username': user[1]})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})

# Logout
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

# Check session
@app.route('/api/check-session')
def check_session():
    if 'user_id' in session:
        return jsonify({'loggedIn': True, 'username': session['username']})
    return jsonify({'loggedIn': False})

# ── EXPENSE ROUTES ───────────────────────────────────────────────────────────

# Get all expenses for logged in user
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, name, amount, category, date FROM expenses WHERE user_id=%s ORDER BY created_at DESC",
                (session['user_id'],))
    rows = cur.fetchall()
    cur.close()

    expenses = [{'id': r[0], 'name': r[1], 'amount': str(r[2]), 'category': r[3], 'date': r[4]} for r in rows]
    return jsonify({'success': True, 'expenses': expenses})

# Add expense
@app.route('/api/expenses', methods=['POST'])
def add_expense():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json()
    name = data.get('name')
    amount = data.get('amount')
    category = data.get('category')
    date = data.get('date')

    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO expenses (user_id, name, amount, category, date) VALUES (%s, %s, %s, %s, %s)",
                (session['user_id'], name, amount, category, date))
    mysql.connection.commit()
    new_id = cur.lastrowid
    cur.close()

    return jsonify({'success': True, 'id': new_id})

# Delete expense
@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM expenses WHERE id=%s AND user_id=%s", (expense_id, session['user_id']))
    mysql.connection.commit()
    cur.close()

    return jsonify({'success': True})

# ── BUDGET ROUTES ────────────────────────────────────────────────────────────

# Get budget
@app.route('/api/budget', methods=['GET'])
def get_budget():
    if 'user_id' not in session:
        return jsonify({'success': False}), 401

    cur = mysql.connection.cursor()
    cur.execute("SELECT amount FROM budget WHERE user_id=%s", (session['user_id'],))
    row = cur.fetchone()
    cur.close()

    if row:
        return jsonify({'success': True, 'budget': str(row[0])})
    return jsonify({'success': True, 'budget': None})

# Set budget
@app.route('/api/budget', methods=['POST'])
def set_budget():
    if 'user_id' not in session:
        return jsonify({'success': False}), 401

    data = request.get_json()
    amount = data.get('amount')

    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO budget (user_id, amount) VALUES (%s, %s) ON DUPLICATE KEY UPDATE amount=%s",
                (session['user_id'], amount, amount))
    mysql.connection.commit()
    cur.close()

    return jsonify({'success': True})

# ── Run server ───────────────────────────────────────────────────────────────
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
