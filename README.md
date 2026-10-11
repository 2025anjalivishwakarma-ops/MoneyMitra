# MoneyMitra

An expense tracker that shows where your money goes, warns you before you overspend, and helps you hit a monthly savings goal. The app itself is branded **MoneyMitra**.

Built with React, Tailwind CSS and Lucide icons, on a fullscreen video hero landing page.

## Features

- **Expense tracking.** Add expenses with an amount, category, date and optional note. Delete any entry.
- **Monthly plan.** Set your income and how much you want to save. Your spending limit is income minus the savings goal.
- **Summary cards.** Amount spent, money left (with a suggested daily amount), and projected savings against your goal.
- **Overspending risk.** A green, yellow or red level with a meter and a plain-language message:
  - Green: projected spending is under 85% of your limit.
  - Yellow: between 85% and 100%.
  - Red: over 100%, or already overspent.
- **Spending trend graph.** Cumulative spending day by day, with an even-pace line to your limit and a projection to month end.
- **Category donut chart.** See which categories take the biggest share of your spending.
- **Statistics.** Average spend per day, typical expense, largest expense, busiest day and number of transactions.
- **Savings insights.** Short tips based on your own numbers, such as which category to trim and how small purchases add up.
- **Live background.** A soft animated photo background with slow movement, shifting light and floating particles. It respects the "reduce motion" setting.
- **Private by design.** Everything is saved in your browser (localStorage). There is no server and no account.

## Tech stack

- React 18
- Vite 5
- Tailwind CSS 3
- Lucide React icons
- Geist font (Google Fonts)

## Getting started

You need [Node.js](https://nodejs.org) (LTS version).

```bash
# 1. Clone the repository
git clone https://github.com/2025anjalivishwakarma-ops/MoneyMitra.git
cd MoneyMitra

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open the address shown in the terminal, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
```

The finished site is written to the `dist` folder.

## Project structure

```
public/
  forest.jpg            Photo used for the live background
src/
  App.jsx               Hero section, navbar and mobile menu
  Tracker.jsx           Expense form, summary, risk meter, charts and insights
  Charts.jsx            Donut chart, trend graph and risk meter (SVG)
  analytics.js          Projection, risk level and statistics logic
  LiveBackground.jsx    Animated photo background
  index.css             Tailwind setup and animations
```

## How the risk level works

Rent and bills are treated as one-time monthly costs and counted as they happen. All other spending is projected from your daily average so far. The projected month-end total is compared with your spending limit, and the risk level follows the percentages listed above. Early in the month there is little data, so the estimate is marked as early.

## Notes and limitations

- The savings insights use fixed rules based on your numbers. They are not powered by a language model.
- Data lives only in the browser you use. Clearing site data removes it.
- The hero video loads from an external link. For a long-lasting deployment, host your own video file in `public/`.

## Ideas for the future

- Export expenses to CSV
- Monthly history and comparison between months
- Per-category budgets
- Real AI-generated advice using an API
- Dark and light theme switch

## Author

Anjali Vishwakarma
