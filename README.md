# Bookstore Management System

A web-based Bookstore Management System built for the **IT Training (TCS iON – Python & DBMS)** project at BBD University.
It reproduces every screen and feature from the project report: login, home, add book, search, update stock, process sale (billing + receipt) and sales history.

**Live demo (Vercel):** `<paste your Vercel link here>`
**Source (GitHub):** `<paste your GitHub link here>`

## Features

| Module | What it does |
| --- | --- |
| Login / Logout | Operator sign-in (demo: `admin` / `admin123`) |
| Home | Dashboard with stats and quick-access tiles |
| Add Book | Add / edit / delete books with validation (required fields, numeric price & quantity, unique ISBN) and a searchable catalogue |
| Search Book | Search by title, author, ISBN and category; view details or edit |
| Update Stock | Add, remove or set quantity and update price; low-stock overview |
| Process Sale | Cart, quantity validation against stock, subtotal, discount, GST 18 %, total, print receipt, complete sale |
| Sales History | All past transactions, view any receipt, search, export to CSV |

Business rules from the report (Chapter 2 and 3): sale quantity cannot exceed available stock, quantities and prices cannot be negative, the sale is saved and stock is reduced as one operation, and the unit price is stored on each sale line at the time of sale.

## Tech

Plain HTML, CSS and JavaScript. **No build step, no backend, no database server.**
Data (books, sales) is saved in the browser's `localStorage`, so it works on any static host without errors.
The report's original stack was Python + tkinter + MySQL; the data model (Books, Sales, Sale_Details) is kept the same.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Project structure

```
index.html
css/style.css
js/app.js
README.md
```

## Notes

- Sample data (5 books) is loaded the first time the app opens. Use **Reset demo data** at the bottom of the Home screen to restore it.
- Data lives in the browser it was created in, so each device / browser has its own copy.
