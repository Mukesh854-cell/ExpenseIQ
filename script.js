const addExpenseBtn = document.getElementById("add-expense-btn")
const modal = document.getElementById("modal")
const closeBtn = document.querySelector(".close-btn")
const form = document.getElementById("add-expense-form")
const transactionList = document.getElementById("transaction-list")
const totalSpent = document.getElementById("total-spent")
const totalExpense = document.getElementById("total-expenses")
const highestExpense = document.getElementById("highest-expense")

addExpenseBtn.addEventListener("click", () => {
    modal.style.display = "flex";
})

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
})

let expenses = [];

function addExpense() {
    const name = document.getElementById("expense-name").value;
    const amount = document.getElementById("expense-amount").value;
    const category = document.getElementById("expense-category").value;

    const expense = {
        id: Date.now(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toLocaleDateString()
    }

    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    form.reset();
    modal.style.display = "none";
    displayExpenses();
    updateSummary();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    addExpense();
})

const categoryIcons = {
    food: "🍔",
    transport: "🚗",
    shopping: "🛍",
    entertainment: "🎬",
    other: "📌"
}

function displayExpenses() {
    transactionList.innerHTML = ""
    for (const expense of expenses) {
        const li = document.createElement("li")
        li.dataset.id = expense.id;
        li.innerHTML = `
        <div class="expense-left">
                <span class="category-icon"> ${categoryIcons[expense.category]}</span>
            <div class="expense-middle">
                <p>${expense.name}</p>
                <span>${expense.category}</span>
            </div>
        </div>

        <div class="expense-right">
            <p>₹${expense.amount}</p>
        </div>
        `
        transactionList.appendChild(li)

        const deleteBtn = document.createElement("button")
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn")
        deleteBtn.addEventListener("click", () => {
            expenses = expenses.filter(expense => expense.id !== Number(li.dataset.id));
            localStorage.setItem("expenses", JSON.stringify(expenses));
            displayExpenses();
            updateSummary();
        })
        const expenseRight = li.querySelector(".expense-right");
        expenseRight.appendChild(deleteBtn);
    }
}

function updateSummary() {

    if (expenses.length === 0) {
        totalSpent.textContent = "0";
        totalExpense.textContent = "0";
        highestExpense.textContent = "0";
        return;
    }

    let total = 0;
    for (const expense of expenses) {
        total += Number(expense.amount);
    }

    let highest = 0;
    for (const expense of expenses) {
        if (Number(expense.amount > highest)) {
            highest = Number(expense.amount);
        }

        totalSpent.textContent = "₹" + total;
        totalExpense.textContent = expenses.length;
        highestExpense.textContent = "₹" + highest;
    }
}

function loadExpenses() {
    const saved = localStorage.getItem("expenses");
    if (saved) {
        expenses = JSON.parse(saved);
    }
    displayExpenses();
    updateSummary();
}

loadExpenses();