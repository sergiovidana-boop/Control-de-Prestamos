let credits = JSON.parse(localStorage.getItem('credits_data')) || [];
let currentCreditIndex = null;

const creditForm = document.getElementById('credit-form');
const creditsList = document.getElementById('credits-list');
const modalOverlay = document.getElementById('payment-modal');
const paymentForm = document.getElementById('payment-form');

function saveToStorage() {
  localStorage.setItem('credits_data', JSON.stringify(credits));
}

function calculateCreditTotals(credit) {
  const totalToPay = credit.months * credit.monthly_payment + credit.opening_fee;
  const history = credit.payment_history || [];
  const totalPaid = history.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, totalToPay - totalPaid);
  const isCompleted = remaining <= 0;

  return { totalToPay, totalPaid, remaining, isCompleted };
}

function renderCredits() {
  creditsList.innerHTML = '';

  if (credits.length === 0) {
    creditsList.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b;">No hay créditos registrados.</td></tr>`;
    return;
  }

  credits.forEach((credit, index) => {
    if (!credit.payment_history) credit.payment_history = [];

    const totals = calculateCreditTotals(credit);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${credit.concept}</strong></td>
      <td>$${credit.amount.toFixed(2)}</td>
      <td>$${credit.opening_fee.toFixed(2)}</td>
      <td>$${totals.totalToPay.toFixed(2)}</td>
      <td style="color: var(--success); font-weight:600;">$${totals.totalPaid.toFixed(2)}</td>
      <td style="color: var(--danger); font-weight:600;">$${totals.remaining.toFixed(2)}</td>
      <td>
        <span class="badge ${totals.isCompleted ? 'badge-completed' : 'badge-active'}">
          ${totals.isCompleted ? 'Liquidado' : `${credit.payment_history.length}/${credit.months} pagos`}
        </span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-small btn-secondary" onclick="openModal(${index})">📋 Ver Detalle / Pagos</button>
          <button class="btn btn-small btn-danger" onclick="deleteCredit(${index})">Eliminar</button>
        </div>
      </td>
    `;
    creditsList.appendChild(tr);
  });
}

creditForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newCredit = {
    concept: document.getElementById('concept').value,
    amount: parseFloat(document.getElementById('amount').value),
    opening_fee: parseFloat(document.getElementById('opening_fee').value) || 0,
    months: parseInt(document.getElementById('months').value),
    monthly_payment: parseFloat(document.getElementById('monthly_payment').value),
    payment_history: []
  };

  credits.push(newCredit);
  saveToStorage();
  renderCredits();
  creditForm.reset();
});

window.openModal = function(index) {
  currentCreditIndex = index;
  const credit = credits[index];
  const totals = calculateCreditTotals(credit);

  document.getElementById('modal-title').textContent = `Crédito: ${credit.concept}`;
  document.getElementById('pay-date').valueAsDate = new Date();
  document.getElementById('pay-amount').value = credit.monthly_payment;

  document.getElementById('modal-summary').innerHTML = `
    <p style="margin:4px 0;"><strong>Total del Crédito:</strong> $${totals.totalToPay.toFixed(2)}</p>
    <p style="margin:4px 0; color: var(--success);"><strong>Total Abonado:</strong> $${totals.totalPaid.toFixed(2)}</p>
    <p style="margin:4px 0; color: var(--danger);"><strong>Saldo Pendiente:</strong> $${totals.remaining.toFixed(2)}</p>
  `;

  renderPaymentHistory();
  modalOverlay.style.display = 'flex';
};

function renderPaymentHistory() {
  const historyList = document.getElementById('payments-history');
  historyList.innerHTML = '';

  const history = credits[currentCreditIndex].payment_history || [];

  if (history.length === 0) {
    historyList.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">No hay pagos registrados.</td></tr>`;
    return;
  }

  history.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date}</td>
      <td><strong>$${item.amount.toFixed(2)}</strong></td>
      <td>${item.note || '-'}</td>
    `;
    historyList.appendChild(tr);
  });
}

paymentForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (currentCreditIndex === null) return;

  const newPayment = {
    date: document.getElementById('pay-date').value,
    amount: parseFloat(document.getElementById('pay-amount').value),
    note: document.getElementById('pay-note').value
  };

  credits[currentCreditIndex].payment_history.push(newPayment);
  saveToStorage();
  renderCredits();
  openModal(currentCreditIndex);
  document.getElementById('pay-note').value = '';
});

window.closeModal = function() {
  modalOverlay.style.display = 'none';
  currentCreditIndex = null;
};

window.deleteCredit = function(index) {
  if (confirm('¿Estás seguro de eliminar este registro?')) {
    credits.splice(index, 1);
    saveToStorage();
    renderCredits();
  }
};

renderCredits();
