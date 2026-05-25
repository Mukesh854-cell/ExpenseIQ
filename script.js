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
    form.reset();
    modal.style.display = "none";
    displayExpenses();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    addExpense();
})

function displayExpenses() {
    transactionList.innerHTML = ""
    for (const expense of expenses) {
        const li = document.createElement("li")
        li.dataset.id = expense.id;
        li.innerHTML = `${expense.name} - ${expense.category} - ${expense.amount}₹`
        transactionList.appendChild(li)

        const deleteBtn = document.createElement("button")
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn")
        deleteBtn.addEventListener("click", () => {
            expenses = expenses.filter(expense => expense.id !== Number(li.dataset.id))
            displayExpenses();
        })
        li.appendChild(deleteBtn);
    }
}

