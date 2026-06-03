fetch('/api/check-session')
    .then(res => res.json())
    .then(data => {
        if (!data.loggedIn) {
            window.location.href = '/login.html';
        }
    });

// DOM ELEMENTS
const addExpenseBtn = document.getElementById("add-expense-btn");
const modal = document.getElementById("modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("add-expense-form");
const transactionList = document.getElementById("transaction-list");
const totalSpent = document.getElementById("total-spent");
const totalExpense = document.getElementById("total-expenses");
const highestExpense = document.getElementById("highest-expense");
const setBudgetBtn = document.getElementById("set-budget-btn");
const budgetInput = document.getElementById("budget-input");
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

// GLOBAL VARIABLE
let expenses = [];
let categoryChartInstance = null;
let dailyChartInstance = null;

// CATEGORY ICONS
const categoryIcons = {
    food: "🍔",
    transport: "🚗",
    shopping: "🛍",
    entertainment: "🎬",
    other: "📌"
};

// MODAL OPEN/CLOSE
addExpenseBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// GREETING
function setGreeting() {
    const hour = new Date().getHours();
    const greeting = document.querySelector(".greeting");
    if (hour < 12) {
        greeting.textContent = "Good Morning 🌞";
    } else if (hour < 17) {
        greeting.textContent = "Good Afternoon ☀️";
    } else {
        greeting.textContent = "Good Evening 🌙";
    }
}
setGreeting();

// DATE BADGE
function updateDate() {
    const dateBadge = document.getElementById("current-date");
    dateBadge.textContent = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}
updateDate();

// THEME TOGGLE
const themeToggle = document.getElementById("theme-toggle");

function toggleTheme() {
    if (document.body.classList.contains("dark-theme")) {
        document.body.classList.remove("dark-theme");
        themeToggle.textContent = "🌙";
    } else {
        document.body.classList.add("dark-theme");
        themeToggle.textContent = "☀️";
    }
}

themeToggle.addEventListener("click", toggleTheme);

// NAVIGATION
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
    });
});

// ADD EXPENSES
async function addExpense() {

    const budgetCheck = await fetch('/api/budget');
    const budgetData = await budgetCheck.json();
    if (!budgetData.budget) {
        alert("Please set a monthly budget first");
        return;
    }

    const name = document.getElementById("expense-name").value;
    const amount = document.getElementById("expense-amount").value;
    const category = document.getElementById("expense-category").value;

    if (!name || !amount || amount <= 0) {
        alert("Please fill in all fields correctly");
        return;
    }

    const date = new Date().toLocaleDateString();

    const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, category, date })
    });

    const data = await response.json();

    if (data.success) {
        form.reset();
        modal.style.display = "none";
        await loadExpenses();
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    addExpense();
});

// DISPLAY EXPENSES
function displayExpenses() {
    transactionList.innerHTML = "";

    if (expenses.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <div>😊 No expenses yet</div>
                <div>Add your first expense!</div>
            </div>`;
        return;
    }

    for (const expense of expenses) {
        const li = document.createElement("li");
        li.dataset.id = expense.id;
        li.innerHTML = `
            <div class="expense-left">
                <span class="category-icon">${categoryIcons[expense.category]}</span>
                <div class="expense-middle">
                    <p>${expense.name}</p>
                    <span>${expense.category}</span>
                </div>
            </div>
            <div class="expense-right">
                <p>₹${expense.amount}</p>
            </div>`;

        transactionList.appendChild(li);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");

        // CHANGED: DELETE request to Flask API instead of filtering localStorage array
        deleteBtn.addEventListener("click", async () => {
            li.style.animation = "fadeOut 0.3s ease forwards";
            setTimeout(async () => {
                await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' });
                await loadExpenses(); // CHANGED: reload from MySQL
            }, 300);
        });

        const expenseRight = li.querySelector(".expense-right");
        expenseRight.appendChild(deleteBtn);
    }
}

// ── UPDATE SUMMARY
function updateSummary() {
    let total = 0;
    let highest = 0;

    for (const expense of expenses) {
        total += Number(expense.amount);
        if (Number(expense.amount) > highest) {
            highest = Number(expense.amount);
        }
    }

    totalSpent.textContent = "₹" + total;
    totalExpense.textContent = expenses.length;
    highestExpense.textContent = "₹" + highest;

    updateBudget();
}

// UPDATE BUDGET
async function updateBudget() {
    // CHANGED: GET budget from Flask API instead of localStorage.getItem
    const response = await fetch('/api/budget');
    const data = await response.json();
    const set = data.budget;

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
    document.getElementById("remaining-balance").textContent = "₹" + (set - total);

    if (total > Number(set)) {
        document.getElementById("remaining-balance").style.color = "var(--danger)";
        // CHANGED: use sessionStorage for alert flag (localStorage still works for this)
        if (!sessionStorage.getItem("budgetAlertShown")) {
            alert("Warning! You have exceeded your monthly budget!");
            sessionStorage.setItem("budgetAlertShown", "true");
        }
    } else {
        document.getElementById("remaining-balance").style.color = "var(--accent)";
        sessionStorage.removeItem("budgetAlertShown");
    }
}

// SET BUDGET
setBudgetBtn.addEventListener("click", async () => {
    const budget = budgetInput.value;

    if (!budget || budget <= 0) {
        alert("Please enter a valid budget amount");
        return;
    }

    // CHANGED: POST budget to Flask API instead of localStorage.setItem
    await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: budget })
    });

    budgetInput.value = "";
    await updateBudget();
});

// LOAD EXPENSES
async function loadExpenses() {
    const response = await fetch('/api/expenses');
    const data = await response.json();

    if (data.success) {
        expenses = data.expenses; // fill global array from MySQL data
        displayExpenses();
        updateSummary();
        updateBudget();
    }
}

// CHARTS
function renderCharts() {
    const categoryTotals = {};
    const dailyTotals = {};

    for (const expense of expenses) {
        // Category totals
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += Number(expense.amount);
        } else {
            categoryTotals[expense.category] = Number(expense.amount);
        }
        // Daily totals
        if (dailyTotals[expense.date]) {
            dailyTotals[expense.date] += Number(expense.amount);
        } else {
            dailyTotals[expense.date] = Number(expense.amount);
        }
    }

    const categoryCharts = document.getElementById("category-chart");
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
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Spending by Category' }
            }
        }
    });

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
                title: { display: true, text: 'Daily Spending' }
            }
        }
    });
}

// HISTORY
function renderHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";

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

// LOGOUT
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
}

loadExpenses();