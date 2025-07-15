# React + TypeScript + Vite Project

This project uses **React**, **TypeScript**, and **Vite** as the foundation, along with useful conventions and tools like **React Query**, **BEM CSS naming**, and **Custom React Hooks** to ensure clean, scalable, and performant development.

---

## 🎨 CSS Architecture: BEM Naming Convention (use as much as possible)

We follow the **BEM (Block Element Modifier)** naming convention for all CSS class names.


### 💡 Benefits

- No class name collisions
- Easier to understand the structure of components
- Promotes reusability and scalability




## 🪝 Custom Hook: useDockerHeight ( we use this becase in mobile view we are using docker , helping us with components that should be on view)

The `useDockerHeight` hook dynamically calculates and sets the height of a container (often the main app body or a scrollable section) to fit the remaining vertical space, especially useful when you have fixed headers or footers.

### ✅ Purpose

To adjust the height of an element (e.g., `.container`) based on the height of another reference element (e.g., a fixed `.header` or `.navbar`), ensuring a full-page layout without overflow issues.

### 🧠 How It Works

It:
- Measures the height of the reference element using `getBoundingClientRect`
- Subtracts that height from the viewport height
- Sets the result as the height for the target container
- Automatically updates on window resize
