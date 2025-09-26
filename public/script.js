document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const tableBody = document.querySelector('#transaction-table tbody');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const netBalanceEl = document.getElementById('net-balance');
    const exportButton = document.getElementById('export-button');
    const amountInput = document.getElementById('amount-input');

    // Mengambil dan menampilkan data saat halaman dimuat
    fetchTransactions();

    // Event listener untuk memformat angka di input secara real-time
    amountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); 
        
        if (value) {
            const formattedValue = new Intl.NumberFormat('id-ID').format(value);
            e.target.value = formattedValue;
        } else {
            e.target.value = '';
        }
    });

    // Event listener untuk menambahkan transaksi
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('date-input').value;
        const description = document.getElementById('description-input').value;
        
        const amountString = amountInput.value.replace(/\./g, '');
        const amount = parseFloat(amountString);
        
        const type = document.getElementById('type-input').value;

        await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, description, amount, type })
        });
        
        form.reset();
        fetchTransactions();
    });

    // DELEGASI EVENT UNTUK TOMBOL HAPUS
    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            
            try {
                const response = await fetch(`/api/transactions/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) { 
                    fetchTransactions();
                } else {
                    const errorData = await response.json();
                    alert('Gagal menghapus transaksi: ' + errorData.message);
                }
            } catch (error) {
                alert('Terjadi kesalahan jaringan saat menghapus transaksi.');
            }
        }
    });

    // Fungsi untuk mengambil dan menampilkan data transaksi
    async function fetchTransactions() {
        const res = await fetch('/api/transactions');
        const transactions = await res.json();
        
        tableBody.innerHTML = '';
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.date}</td>
                <td>${t.description}</td>
                <td>Rp ${t.amount.toLocaleString('id-ID')}</td>
                <td>${t.type}</td>
                <td><button class="delete-btn" data-id="${t.id}">Hapus</button></td>
            `;
            tableBody.appendChild(row);

            if (t.type === 'Pemasukan') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });
        
        totalIncomeEl.textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
        totalExpenseEl.textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
        netBalanceEl.textContent = `Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`;
    }

    // Mengunduh file Excel saat tombol diklik
    exportButton.addEventListener('click', () => {
        window.location.href = '/api/export';
    });
});