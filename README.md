# ⬡ Taskflow — Kanban Board

A production-grade Kanban task manager built with **pure HTML, CSS, and JavaScript** — no frameworks, no build tools, no dependencies.

> Perfect for your portfolio or resume as it demonstrates DOM mastery, drag-and-drop API, local storage, and clean UI/UX design.

---

## 🚀 Getting Started

No installation required. Just open the file:

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Serve locally (recommended for best experience)
npx serve .
# or
python3 -m http.server 3000
# then visit http://localhost:3000
```

---

## ✨ Features

| Feature | Details |
|---|---|
| **Drag & Drop** | Move cards between columns with smooth animations |
| **5 Kanban Columns** | Backlog → To Do → In Progress → Review → Done |
| **Full CRUD** | Create, edit, and delete tasks via modal |
| **Priority Levels** | Low / Medium / High / Critical with color badges |
| **Tags** | Design, Dev, Research, Bug, Feature, Docs, Testing |
| **Due Dates** | Smart labels — "Today", "Tomorrow", "3d overdue" |
| **Dark / Light Mode** | Toggle with persistence via localStorage |
| **LocalStorage** | Tasks and settings survive page refresh |
| **Progress Bar** | Live completion indicator on the Done column |
| **Project Name** | Click-to-edit workspace name |
| **Keyboard Shortcuts** | `Ctrl/Cmd+K` to add task, `Esc` to close modals |
| **Toast Notifications** | Feedback on every action |
| **Responsive** | Works on mobile and tablet |

---

## 📁 Project Structure

```
kanban-board/
├── index.html     # Main HTML — layout, modals, board structure
├── style.css      # All styles — dark/light theme, animations, layout
├── app.js         # All logic — state, drag-drop, CRUD, localStorage
└── README.md      # You are here
```

---

## 🛠 Tech Stack

- **HTML5** — Semantic markup, drag-and-drop attributes
- **CSS3** — Custom properties (variables), Flexbox, Grid, animations
- **Vanilla JS (ES6+)** — No frameworks, no dependencies
- **Google Fonts** — Outfit + JetBrains Mono
- **Web APIs** — Drag and Drop API, localStorage, Date API

---

## 💡 What This Demonstrates (Resume Points)

- ✅ Drag & Drop API — native HTML5 draggable
- ✅ State management without a framework
- ✅ CSS custom properties for theming
- ✅ Smooth CSS animations & micro-interactions
- ✅ LocalStorage for data persistence
- ✅ Modal management and form validation
- ✅ Accessible, keyboard-navigable UI
- ✅ Clean code architecture — separation of concerns
- ✅ Responsive design

---

## 🎨 Design Decisions

- **Dark-first** design with full light mode support
- **Outfit** font for a modern, readable feel
- **JetBrains Mono** for badges and counts — technical clarity
- Accent color: `#6ee7b7` (emerald green) — stands out without being harsh
- Subtle animations on card entry, drag state, and modals

---

## 📸 Customization

Edit the CSS variables in `style.css` under `:root` to change:
- `--accent` — primary brand color
- `--col-w` — column width (default 290px)
- `--font` — main font family

---

## 📝 License

MIT — free to use, modify, and showcase.