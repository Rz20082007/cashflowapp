// index.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        description TEXT,
        amount INTEGER,
        type TEXT
    )`);
});

// API untuk mendapatkan semua transaksi
app.get('/api/transactions', (req, res) => {
    db.all(`SELECT * FROM transactions ORDER BY date DESC, id DESC`, (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(200).json(rows);
        }
    });
});

// API untuk menambahkan transaksi baru
app.post('/api/transactions', (req, res) => {
    const { date, description, amount, type } = req.body;
    db.run(`INSERT INTO transactions (date, description, amount, type) VALUES (?, ?, ?, ?)`, 
        [date, description, amount, type], function(err) {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(201).json({ id: this.lastID });
        }
    });
});

// API untuk menghapus transaksi
app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM transactions WHERE id = ?`, id, function(err) {
        if (err) {
            console.error('Error saat menghapus dari DB:', err.message);
            res.status(500).send({ message: 'Gagal menghapus transaksi di database' });
        } else {
            if (this.changes > 0) {
                res.status(200).send({ message: 'Transaksi berhasil dihapus' });
            } else {
                res.status(404).send({ message: 'Transaksi tidak ditemukan' });
            }
        }
    });
});

// API untuk ekspor data ke Excel
app.get('/api/export', (req, res) => {
    db.all(`SELECT date, description, amount, type FROM transactions ORDER BY date DESC, id DESC`, (err, rows) => {
        if (err) {
            return res.status(500).send('Gagal mengekspor data');
        }

        const data = [
            ["Tanggal", "Deskripsi", "Jumlah", "Tipe"],
            ...rows.map(row => [row.date, row.description, row.amount, row.type])
        ];

        const worksheet = xlsx.utils.aoa_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Transaksi");

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="data_keuangan.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(excelBuffer);
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});