const template = document.createElement("template");
template.innerHTML = `
  <link rel="stylesheet" type="text/css"
        href="${import.meta.url.match(/.*\//)[0]}/taskview.css"/>
  <h1>Tasks</h1>

  <div id="message"><p>Waiting for server data.</p></div>
  <div id="newtask">
      <button type="button" disabled>New task</button>
  </div>

  <!-- The task list -->
  <task-list></task-list>

  <!-- The Modal -->
  <task-box></task-box>
`;

export default class TaskView extends HTMLElement {
  static get observedAttributes() {
    return ["data-serviceurl"];
  }

  constructor() {
    super();
    /** @type {string} base URL for services, from data-serviceurl */
    this._baseUrl = "./api";
    /** @type {ShadowRoot} */
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Elements
    this.$message = this.shadowRoot.querySelector("#message");
    this.$btnNew = this.shadowRoot.querySelector("#newtask button");
    /** @type {HTMLElement} */
    this.$taskList = this.shadowRoot.querySelector("task-list");
    /** @type {HTMLElement} */
    this.$taskBox = this.shadowRoot.querySelector("task-box");

    // Bind handlers
    this._onNewTaskClick = this._onNewTaskClick.bind(this);
  }

  connectedCallback() {
    // Base URL from attribute (relative path required)
    const attr = this.getAttribute("data-serviceurl");
    if (attr && attr.trim() !== "") this._baseUrl = attr.trim();

    // Wire UI
    this.$btnNew.addEventListener("click", this._onNewTaskClick);
    this._init().catch(err => this._showError(err));
  }

  disconnectedCallback() {
    this.$btnNew.removeEventListener("click", this._onNewTaskClick);
  }

  attributeChangedCallback(name, _old, val) {
    if (name === "data-serviceurl" && typeof val === "string" && val.trim() !== "") {
      this._baseUrl = val.trim();
    }
  }

  // ---------- Initialization ----------

  async _init() {
    // Initial state
    this._setMessage("Waiting for server data.");
    this._setNewButtonEnabled(false);

    // Load statuses first (needed by TaskBox & TaskList)
    const statuses = await this._fetchStatuses();
    this._applyStatuses(statuses);

    // Initialize callbacks only after statuses are known
    this._wireCallbacks();

    // Load initial tasks
    const tasks = await this._fetchTaskList();
    this._renderTasks(tasks);

    // Enable the New Task button
    this._setNewButtonEnabled(true);
  }

  _wireCallbacks() {
    // TaskBox: when user submits "Add task"
    this.$taskBox.addNewtaskCallback(async (task) => {
      try {
        const created = await this._createTask(task);
        if (created) {
          this.$taskList.showTask(created);
          this._updateEmptyState();
          this.$taskBox.close();
          this._clearMessage();
        }
      } catch (err) {
        this._showError(err);
      }
    });

    // TaskList: change status of an existing task
    this.$taskList.addChangestatusCallback(async (id, newStatus) => {
      try {
        const ok = await this._updateTaskStatus(id, newStatus);
        if (ok) {
          this.$taskList.updateTask(id, { status: newStatus });
          this._clearMessage();
        }
      } catch (err) {
        this._showError(err);
      }
    });

    // TaskList: delete task
    this.$taskList.addDeletetaskCallback(async (id) => {
      try {
        const ok = await this._deleteTask(id);
        if (ok) {
          this.$taskList.removeTask(id);
          this._updateEmptyState();
          this._clearMessage();
        }
      } catch (err) {
        this._showError(err);
      }
    });
  }

  // ---------- UI helpers ----------

  _onNewTaskClick() {
    // Open modal (TaskBox owns its dialog DOM)
    this.$taskBox.show();
  }

  _applyStatuses(statuses) {
    this.$taskList.setStatuseslist(statuses);
    this.$taskBox.setStatuseslist(statuses);
  }

  _renderTasks(tasks) {
    // Show each task through TaskList API
    for (const t of tasks) {
      // Expected shape: {id, title, status}
      this.$taskList.showTask(t);
    }
    this._updateEmptyState();
  }

  _updateEmptyState() {
    const num = this.$taskList.getNumtasks();
    if (num === 0) {
      this._setMessage("No tasks in list.");
    } else {
      this._clearMessage();
    }
  }

  _setNewButtonEnabled(enabled) {
    if (enabled) this.$btnNew.removeAttribute("disabled");
    else this.$btnNew.setAttribute("disabled", "");
  }

  _setMessage(text) {
    // Safe text only — avoid innerHTML with external data
    this.$message.style.display = "";
    this.$message.replaceChildren(); // clear
    const p = document.createElement("p");
    p.textContent = text;
    this.$message.appendChild(p);
  }

  _clearMessage() {
    this.$message.style.display = "none";
    this.$message.replaceChildren();
  }

  _showError(err) {
    const msg = (err && err.message) ? err.message : String(err);
    this._setMessage(`Error: ${msg}`);
    this._setNewButtonEnabled(true); // allow retry actions
  }

  // ---------- Ajax (Fetch) — ONLY in TaskView ----------

  async _fetchStatuses() {
    const url = `${this._baseUrl}/allstatuses`;
    const data = await this._fetchJSON(url, { method: "GET" });
    if (!data || data.responseStatus !== true || !Array.isArray(data.allstatuses)) {
      throw new Error("Failed to load statuses.");
    }
    return data.allstatuses;
  }

  async _fetchTaskList() {
    const url = `${this._baseUrl}/tasklist`;
    const data = await this._fetchJSON(url, { method: "GET" });
    if (!data || data.responseStatus !== true || !Array.isArray(data.tasks)) {
      // Show empty state but not fatal
      return [];
    }
    return data.tasks;
  }

  async _createTask(task) {
    const url = `${this._baseUrl}/task`;
    const payload = {
      title: task?.title ?? "",
      status: task?.status ?? "",
    };
    const data = await this._fetchJSON(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (data && data.responseStatus === true && data.task && typeof data.task.id === "number") {
      return data.task; // {id, title, status}
    }
    throw new Error("Failed to add task.");
  }

  async _updateTaskStatus(id, status) {
    const url = `${this._baseUrl}/task/${encodeURIComponent(id)}`;
    const data = await this._fetchJSON(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ status }),
    });
    if (data && data.responseStatus === true) return true;
    throw new Error("Failed to update task status.");
  }

  async _deleteTask(id) {
    const url = `${this._baseUrl}/task/${encodeURIComponent(id)}`;
    const data = await this._fetchJSON(url, { method: "DELETE" });
    if (data && data.responseStatus === true) return true;
    throw new Error("Failed to delete task.");
  }

  async _fetchJSON(url, init) {
    // Relative URLs only; do not assume host changes
    const resp = await fetch(url, init);
    // Spring Boot returns JSON with content-type application/json; charset=utf-8
    // but we'll be tolerant and still try json if ok.
    if (!resp.ok) {
      throw new Error(`${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  }
}

customElements.define("task-view", TaskView);	