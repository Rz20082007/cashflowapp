// index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API untuk mendapatkan semua transaksi
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: [
                { date: 'desc' },
                { id: 'desc' }
            ]
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// API untuk menambahkan transaksi baru
app.post('/api/transactions', async (req, res) => {
    const { date, description, amount, type } = req.body;
    try {
        const transaction = await prisma.transaction.create({
            data: {
                date,
                description,
                amount,
                type
            }
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// API untuk menghapus transaksi
app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await prisma.transaction.delete({
            where: {
                id: parseInt(id)
            }
        });
        res.status(200).send({ message: 'Transaksi berhasil dihapus' });
    } catch (error) {
        res.status(404).send({ message: 'Transaksi tidak ditemukan' });
    }
});

// API untuk ekspor data ke Excel
app.get('/api/export', async (req, res) => {
    try {
        const rows = await prisma.transaction.findMany({
            orderBy: [
                { date: 'desc' },
                { id: 'desc' }
            ]
        });

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
    } catch (error) {
        res.status(500).send('Gagal mengekspor data');
    }
});

// Ini penting untuk Vercel
// app.listen() tidak diperlukan karena Vercel akan menjalankannya sendiri
// Export app agar Vercel bisa menggunakannya
module.exports = app;