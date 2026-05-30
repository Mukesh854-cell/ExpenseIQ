let categoryChartInstance = null;
let dailyChartInstance = null;

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

    const budget =  localStorage.getItem("budget");
    if (!budget) {
        alert("Please set a monthly budget first")
        return;
    }

    const name = document.getElementById("expense-name").value;
    const amount = document.getElementById("expense-amount").value;
    const category = document.getElementById("expense-category").value;

    if (amount <= 0) {
        alert("Please fill in all fields correctly")
        return;
    }

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
    renderCharts();
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

    if (expenses.length === 0) {
        transactionList.innerHTML =
        `<div class="empty-state">
            <div>😊 No expenses yet </div>
            <div>Add your first expense!</div>
        </div>`
        return;
    }
    
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
            li.style.animation = "fadeOut 0.3s ease forwards";
            setTimeout(() => {
                expenses = expenses.filter(expense => expense.id !== Number(li.dataset.id));
                localStorage.setItem("expenses", JSON.stringify(expenses));
                displayExpenses();
                updateSummary();
                renderCharts();
            }, 300);
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

    updateBudget();

}

function loadExpenses() {
    const saved = localStorage.getItem("expenses");
    if (saved) {
        expenses = JSON.parse(saved);
    }
    displayExpenses();
    updateSummary();
    updateBudget();
}

loadExpenses();

const themeToggle = document.getElementById("theme-toggle");

function toggleTheme() {

    if (document.body.classList.contains("dark-theme")) {
        document.body.classList.remove("dark-theme");
        themeToggle.textContent = "🌙"
    } else {
        document.body.classList.add("dark-theme");
        themeToggle.textContent = "☀️"
    }
}

document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

function setGreeting() {
    const hour = new Date().getHours();
    const greeting = document.querySelector(".greeting");

    if (hour < 12) {
        greeting.textContent = "Good Morning 🌞"
    } else if (hour < 17) {
        greeting.textContent = "Good Afternoon ☀️"
    } else {
        greeting.textContent = "Good Evening 🌙";
    }
}

setGreeting();

const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        pages.forEach(page => page.style.display = "none");
        document.getElementById(btn.dataset.page + "-page").style.display = "block";
        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");


        if (btn.dataset.page === "statistics") {
            renderCharts();
        }

        if (btn.dataset.page === "history") {
            renderHistory();
        }
    })
})


function renderCharts() {

    const categoryTotals = {};

    const categoryCharts = document.getElementById("category-chart")

    for (const expense of expenses) {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += Number(expense.amount);
        } else {
            categoryTotals[expense.category] = Number(expense.amount);
        }
    }

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(categoryCharts, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#c8a96e', '#e07b6a', '#6a9e6e', '#6a8fe0', '#a06ae0']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Spending by Category'
                }
            }
        }
    })

    const dailyTotals = {};

    for (const expense of expenses) {
        if (dailyTotals[expense.date]) {
            dailyTotals[expense.date] += Number(expense.amount);
        } else {
            dailyTotals[expense.date] = Number(expense.amount);
        }
    }

    const dailyChartCanvas = document.getElementById("daily-chart");

    if (dailyChartInstance) dailyChartInstance.destroy();

    dailyChartInstance = new Chart(dailyChartCanvas, {
        type: 'bar',
        data: {
            labels: Object.keys(dailyTotals),
            datasets: [{
                label: 'Daily Spending',
                data: Object.values(dailyTotals),
                backgroundColor: ['#c8a96e', '#e07b6a', '#6a9e6e', '#6a8fe0', '#a06ae0']
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Spending'
                }
            }
        }
    })
}

function updateDate() {
    const dateBadge = document.getElementById("current-date");
    dateBadge.textContent = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

updateDate();

function renderHistory() {

    const historyList = document.getElementById("history-list");
    historyList.innerHTML = ""

    const groupedByDate = {};

    for (const expense of expenses) {
        if (groupedByDate[expense.date]) {
            groupedByDate[expense.date].push(expense);
        } else {
            groupedByDate[expense.date] = [expense];
        }
    }

    Object.keys(groupedByDate).forEach(date => {
        const dateGroup = document.createElement("div");
        dateGroup.classList.add("date-group");
        dateGroup.innerHTML = `<h3>${date}</h3>`;

        groupedByDate[date].forEach(expense => {
            const item = document.createElement("div");
            item.classList.add("history-item");
            item.innerHTML = `${categoryIcons[expense.category]} ${expense.name} - ₹${expense.amount}`;
            dateGroup.appendChild(item);
        });

        historyList.appendChild(dateGroup);
    });
}


const setBudgetBtn = document.getElementById("set-budget-btn");
const budgetInput = document.getElementById("budget-input");

setBudgetBtn.addEventListener("click", () => {
    const budget = budgetInput.value;

    if (!budget || budget <= 0) {
        alert("Please enter a valid budget amount");
        return;
    }
    localStorage.setItem("budget", budget);
    updateBudget();
    budgetInput.value = "";
});

function updateBudget() {
    const set = localStorage.getItem("budget");

    if (!set) {
        document.getElementById("budget-amount").textContent = "₹0";
        document.getElementById("budget-spent").textContent = "₹0";
        document.getElementById("remaining-balance").textContent = "₹0";
        return;
    }

    let total = 0;
    for (const expense of expenses) {
        total += Number(expense.amount);
    }

    document.getElementById("budget-amount").textContent = "₹" + set;
    document.getElementById("budget-spent").textContent = "₹" + total;
    document.getElementById("remaining-balance").textContent = "₹" + (set- total);

    if (total > Number(set)) {
        document.getElementById("remaining-balance").style.color = "var(--danger)";
        if (!localStorage.getItem("budgetAlertShown")) {
            alert("Warning! You have exceeded your monthly budget!")
            localStorage.setItem("budgetAlertShown", "true")
        }
    } else {
        document.getElementById("remaining-balance").style.color = "var(--accent)"
        localStorage.removeItem("budgetAlertShown");
    }

}