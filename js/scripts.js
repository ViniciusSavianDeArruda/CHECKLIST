// === Seleção de elementos ===
const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const editForm = document.querySelector("#edit-form");
const editInput = document.querySelector("#edit-input");
const cancelEditBtn = document.querySelector("#cancel-edit-btn");
const searchInput = document.querySelector("#search-input");
const eraseBtn = document.querySelector("#erase-button");
const filterSelect = document.querySelector("#filter-select");
const errorMessage = document.querySelector("#error-message");

let oldInputValue = "";
const MAX_TASK_LENGTH = 40;

// === Funções principais ===

// Cria um novo item na lista
function saveTodo(text, done = false, saveToStorage = true) {
  const todo = document.createElement("div");
  todo.classList.add("todo");
  if (done) todo.classList.add("done");

  const title = document.createElement("h3");
  title.innerText = text;
  todo.appendChild(title);

  // Botões: concluir, editar, remover com tooltips (title)
  todo.appendChild(createIconButton("finish-todo", "fa-check", "Marcar como feito"));
  todo.appendChild(createIconButton("edit-todo", "fa-pen", "Editar tarefa"));
  todo.appendChild(createIconButton("remove-todo", "fa-xmark", "Remover tarefa"));

  todoList.appendChild(todo);
  todoInput.value = "";

  if (saveToStorage) saveTodoLocalStorage({ text, done });
}

// Cria um botão com ícone e tooltip
function createIconButton(className, icon, titleText) {
  const button = document.createElement("button");
  button.classList.add(className);
  button.setAttribute("title", titleText);
  button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  return button;
}

// Alterna entre formulário de adicionar e editar
function toggleForms() {
  todoForm.classList.toggle("hide");
  editForm.classList.toggle("hide");
  todoList.classList.toggle("hide");

  if (!editForm.classList.contains("hide")) {
    editInput.focus();
  }
}

// Atualiza o texto de uma tarefa mantendo o status "done"
function updateTodo(newText) {
  document.querySelectorAll(".todo").forEach((todo) => {
    const title = todo.querySelector("h3");
    if (title.innerText === oldInputValue) {
      const isDone = todo.classList.contains("done");
      title.innerText = newText;
      updateTodoLocalStorage(oldInputValue, newText, isDone);
    }
  });
}

// Filtra tarefas pelo texto digitado
function getSearchedTodos(search) {
  const searchLower = search.toLowerCase();
  document.querySelectorAll(".todo").forEach((todo) => {
    const title = todo.querySelector("h3").innerText.toLowerCase();
    todo.style.display = title.includes(searchLower) ? "flex" : "none";
  });
}

// Filtra tarefas pelo status (todos, feitas, a fazer)
function filterTodos(filter) {
  document.querySelectorAll(".todo").forEach((todo) => {
    const isDone = todo.classList.contains("done");
    const showTodo =
      filter === "all" ||
      (filter === "done" && isDone) ||
      (filter === "todo" && !isDone);
    todo.style.display = showTodo ? "flex" : "none";
  });
}

// === Mensagem de erro com efeito visual ===
function showError(message, inputElement = todoInput) {
  errorMessage.innerText = message;
  errorMessage.classList.remove("hide");
  inputElement.classList.add("error");

  setTimeout(() => {
    errorMessage.classList.add("hide");
    inputElement.classList.remove("error");
  }, 3000);
}

// === Validações auxiliares ===

// Checa se uma tarefa já existe na lista (localStorage) - ignorando case
function isDuplicateTask(text) {
  const todos = getTodosLocalStorage();
  return todos.some((todo) => todo.text.toLowerCase() === text.toLowerCase());
}

// Validação em tempo real para limite de caracteres
function handleInputError(inputElement) {
  const currentLength = inputElement.value.length;
  if (currentLength >= MAX_TASK_LENGTH) {
    showError(`Você atingiu o limite de ${MAX_TASK_LENGTH} caracteres.`, inputElement);
  } else {
    errorMessage.classList.add("hide");
    inputElement.classList.remove("error");
  }
}

// === Eventos ===

// Validação em tempo real para nova tarefa
todoInput.addEventListener("input", () => handleInputError(todoInput));

// Validação em tempo real para edição de tarefa
editInput.addEventListener("input", () => handleInputError(editInput));

// Adicionar tarefa
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputValue = todoInput.value.trim();

  if (!inputValue) {
    showError("Adicione uma tarefa para continuar.", todoInput);
    return;
  }
  if (inputValue.length > MAX_TASK_LENGTH) {
    showError(`A tarefa deve ter no máximo ${MAX_TASK_LENGTH} caracteres.`, todoInput);
    return;
  }
  if (isDuplicateTask(inputValue)) {
    showError("Essa tarefa já existe.", todoInput);
    return;
  }
  saveTodo(inputValue);
});

// Ações: concluir, editar ou remover tarefa
document.addEventListener("click", (e) => {
  const target = e.target;
  const todo = target.closest(".todo");
  if (!todo) return;

  const title = todo.querySelector("h3").innerText;

  if (target.closest(".finish-todo")) {
    todo.classList.toggle("done");
    updateTodoStatusLocalStorage(title);
  } else if (target.closest(".edit-todo")) {
    toggleForms();
    editInput.value = title;
    oldInputValue = title;
  } else if (target.closest(".remove-todo")) {
    todo.remove();
    removeTodoLocalStorage(title);
  }
});

// Cancelar edição
cancelEditBtn.addEventListener("click", () => toggleForms());

// Salvar edição
editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newText = editInput.value.trim();

  if (!newText) {
    showError("A tarefa não pode ficar vazia.", editInput);
    return;
  }
  if (newText.length > MAX_TASK_LENGTH) {
    showError(`A tarefa deve ter no máximo ${MAX_TASK_LENGTH} caracteres.`, editInput);
    return;
  }
  if (newText === oldInputValue) {
    toggleForms();
    return;
  }
  if (isDuplicateTask(newText)) {
    showError("Essa tarefa já existe.", editInput);
    return;
  }

  updateTodo(newText);
  toggleForms();
});

// Campo de busca
searchInput.addEventListener("keyup", () => getSearchedTodos(searchInput.value));

// Botão para apagar busca
eraseBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.dispatchEvent(new Event("keyup"));
});

// Filtro por status
filterSelect.addEventListener("change", () => filterTodos(filterSelect.value));

// === Local Storage ===

function getTodosLocalStorage() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

function saveTodoLocalStorage(todo) {
  const todos = getTodosLocalStorage();
  todos.push(todo);
  localStorage.setItem("todos", JSON.stringify(todos));
}

function removeTodoLocalStorage(todoText) {
  const todos = getTodosLocalStorage().filter((t) => t.text !== todoText);
  localStorage.setItem("todos", JSON.stringify(todos));
}

function updateTodoStatusLocalStorage(todoText) {
  const todos = getTodosLocalStorage().map((todo) => {
    if (todo.text === todoText) {
      return { ...todo, done: !todo.done };
    }
    return todo;
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

function updateTodoLocalStorage(oldText, newText, doneStatus) {
  const todos = getTodosLocalStorage().map((todo) => {
    if (todo.text === oldText) {
      return { text: newText, done: doneStatus };
    }
    return todo;
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

// === Inicialização ===
function loadTodos() {
  getTodosLocalStorage().forEach((todo) => {
    saveTodo(todo.text, todo.done, false); // false para não duplicar no localStorage
  });
}

loadTodos();
