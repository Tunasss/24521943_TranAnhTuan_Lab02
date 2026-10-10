/**
 * @file app.js
 * @description Task Manager application using custom useState hook and VNode rendering.
 * Enforces Web Content Accessibility Guidelines (WCAG) 2.0 Level AA accessibility standards.
 *
 * Rules in force:
 * - DO-01, DO-02: Closure-based useState hook calls.
 * - DO-03: Immutable state updates.
 * - DO-06: document.createTextNode (handled by reactive-engine.js).
 * - DO-07: Visible, descriptive text labels for all buttons.
 * - DO-08: aria-pressed reflecting active filter state.
 * - DO-09: Accessible focus indicators.
 * - DO-10, DO-11: JSDoc comments and expanded abbreviations.
 */

import {
  createElement,
  useState,
  renderApp,
} from './reactive-engine.js';

/**
 * Initial task list mapped from strings to task objects.
 *
 * @type {Array<{ id: number, text: string, done: boolean }>}
 */
const INITIAL_TASKS = ['Review PR', 'Verify AST'].map((text, index) => ({
  id: index + 1,
  text,
  done: false,
}));

/**
 * Root TaskApp Component.
 * Manages task list state and filter selection.
 *
 * @returns {Object} Virtual Node (VNode) describing the Task Manager User Interface (UI).
 */
export function TaskApp() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState('ALL');

  // Derive filtered task list from state (never stored separately in state)
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'ACTIVE') {
      return !task.done;
    }
    if (filter === 'DONE') {
      return task.done;
    }
    return true;
  });

  /**
   * Adds a new task immutably to the state.
   * Reads from the task-input element or provides a default task name.
   */
  const handleAddTask = () => {
    const inputElement = document.getElementById('task-input');
    const enteredText = inputElement ? inputElement.value.trim() : '';
    const text = enteredText || `New Task ${tasks.length + 1}`;

    setTasks((previousTasks) => [
      ...previousTasks,
      {
        id: Date.now(),
        text,
        done: false,
      },
    ]);

    if (inputElement) {
      inputElement.value = '';
    }
  };

  /**
   * Toggles the completion status of a task immutably.
   *
   * @param {number} taskId - Unique identifier of the task to toggle.
   */
  const handleToggleTask = (taskId) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  };

  return createElement(
    'main',
    { className: 'task-app' },
    // Header showing task count
    createElement(
      'header',
      null,
      createElement('h2', null, `Tasks: ${filteredTasks.length}`)
    ),

    // Filter controls section with aria-pressed attributes
    createElement(
      'section',
      { 'aria-label': 'Filter tasks', className: 'filters-section' },
      createElement(
        'button',
        {
          type: 'button',
          'aria-pressed': String(filter === 'ALL'),
          className: filter === 'ALL' ? 'filter-btn active' : 'filter-btn',
          onClick: () => setFilter('ALL'),
        },
        'All'
      ),
      createElement(
        'button',
        {
          type: 'button',
          'aria-pressed': String(filter === 'ACTIVE'),
          className: filter === 'ACTIVE' ? 'filter-btn active' : 'filter-btn',
          onClick: () => setFilter('ACTIVE'),
        },
        'Active'
      ),
      createElement(
        'button',
        {
          type: 'button',
          'aria-pressed': String(filter === 'DONE'),
          className: filter === 'DONE' ? 'filter-btn active' : 'filter-btn',
          onClick: () => setFilter('DONE'),
        },
        'Done'
      )
    ),

    // Add task form section with semantic label, input, and button
    createElement(
      'section',
      { 'aria-label': 'Add new task', className: 'add-task-section' },
      createElement(
        'label',
        { htmlFor: 'task-input' },
        'Task title'
      ),
      createElement('input', {
        id: 'task-input',
        type: 'text',
        placeholder: 'Enter task description',
      }),
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn-add',
          onClick: handleAddTask,
        },
        'Add Task'
      )
    ),

    // Task list rendered as semantic <ul> and <li> elements
    createElement(
      'ul',
      { className: 'task-list', 'aria-label': 'Task list' },
      filteredTasks.map((task) =>
        createElement(
          'li',
          {
            key: task.id,
            className: task.done ? 'task-item done' : 'task-item',
          },
          createElement(
            'span',
            { className: 'task-text' },
            task.text
          ),
          createElement(
            'button',
            {
              type: 'button',
              className: 'btn-toggle',
              'aria-label': `${task.done ? 'Mark active' : 'Mark done'}: ${task.text}`,
              onClick: () => handleToggleTask(task.id),
            },
            task.done ? 'Mark active' : 'Mark done'
          )
        )
      )
    )
  );
}

// Mount the TaskApp into DOM container #app if present in environment
const mountContainer = typeof document !== 'undefined'
  ? document.getElementById('app')
  : null;

if (mountContainer) {
  renderApp(TaskApp, mountContainer);
}
