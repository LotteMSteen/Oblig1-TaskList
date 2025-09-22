const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/tasklist.css"/>

    <div id="tasklist"></div>`;

const tasktable = document.createElement("template");
tasktable.innerHTML = `
    <table>
        <thead><tr><th>Task</th><th>Status</th></tr></thead>
        <tbody></tbody>
    </table>`;

const taskrow = document.createElement("template");
taskrow.innerHTML = `
    <tr>
        <td></td>
        <td></td>
        <td>
            <select>
                <option value="0" selected>&lt;Modify&gt;</option>
            </select>
        </td>
        <td><button type="button">Remove</button></td>
    </tr>`;

/**
  * TaskList
  * Manage view with list of tasks
  */
class TaskList extends HTMLElement {

    constructor() {
        super();

        /**
         * Fill inn rest of the code
         */
		
		super();
		   this.attachShadow({ mode: "open" });
		   this.shadowRoot.appendChild(template.content.cloneNode(true));
		   const host = this.shadowRoot.querySelector("#tasklist");
		   host.appendChild(tasktable.content.cloneNode(true));
    }

    /**
     * @public
     * @param {Array} list with all possible task statuses
     */
    setStatuseslist(allstatuses) {
       
		this.allstatuses = allstatuses; 

		   
		    const select = taskrow.content.querySelector("select");
		    if (!select) return;

		    
		    select.innerHTML = `<option value="0" selected>&lt;Modify&gt;</option>`;

		  
		    allstatuses.forEach(status => {
		        const opt = document.createElement("option");
		        opt.value = status;
		        opt.textContent = status;
		        select.appendChild(opt);
		    });
    }

    /**
     * Add callback to run on change on change of status of a task, i.e. on change in the SELECT element
     * @public
     * @param {function} callback
     */
    addChangestatusCallback(callback) 
	{     
		this._onChangeStatus = callback;

		   
		    if (this._statusChangeHandler) return;

		    this._statusChangeHandler = (e) => {
		        const select = e.target.closest('select');
		        if (!select) return;

		        
		        const newStatus = select.value;
		        if (newStatus === "0") return;

		        const tr = select.closest('tr');
		        if (!tr) return;

		        const id = parseInt(tr.dataset.id, 10);
		        const title = tr.children?.[0]?.textContent || "this task";
		        const ok = window.confirm(`Change status of "${title}" to ${newStatus}?`);

		      
		        select.value = "0";

		       
		        if (ok && typeof this._onChangeStatus === 'function') {
		            this._onChangeStatus(id, newStatus);
		        }
		    };

		    this.shadowRoot.addEventListener('change', this._statusChangeHandler);
    }

    /**
     * Add callback to run on click on delete button of a task
     * @public
     * @param {function} callback
     */
    addDeletetaskCallback(callback) {
		this._onDeleteTask = callback;

		  
		  if (this._deleteHandler) return;

		  this._deleteHandler = (e) => {
		      const btn = e.target.closest('button');
		      if (!btn) return;

		      
		      if (btn.textContent.trim() !== "Remove") return;

		      const tr = btn.closest('tr');
		      if (!tr) return;

		      const id = parseInt(tr.dataset.id, 10);
		      const title = tr.children?.[0]?.textContent || "this task";

		      
		      const ok = window.confirm(`Delete task "${title}"?`);

		      if (ok && typeof this._onDeleteTask === 'function') {
		          this._onDeleteTask(id);
		      }
		  };

		  this.shadowRoot.addEventListener('click', this._deleteHandler);
    }

    /**
     * Add task at top in list of tasks in the view
     * @public
     * @param {Object} task - Object representing a task
     */
    showTask(task) {
		
		const tbody = this.shadowRoot.querySelector("tbody");

		  
		  const row = taskrow.content.cloneNode(true);
		  const tr = row.querySelector("tr");
		  tr.dataset.id = task.id; // store id for lookup later

		
		  tr.children[0].textContent = task.title;
		  tr.children[1].textContent = task.status;

		 
		  if (tbody.firstChild) {
		      tbody.insertBefore(tr, tbody.firstChild);
		  } else {
		      tbody.appendChild(tr);
		  }
	
    }

    /**
     * Update the status of a task in the view
     * @param {Object} task - Object with attributes {'id':taskId,'status':newStatus}
     */
    updateTask(task) {
       
		const tbody = this.shadowRoot.querySelector("tbody");
		    const row = tbody.querySelector(`tr[data-id="${task.id}"]`);
		    if (!row) return;

		    const statusCell = row.children[1];
		    if (statusCell) {
		        statusCell.textContent = task.status;
		    }

		   
		    const select = row.querySelector("select");
		    if (select) {
		        select.value = task.status;
		    }
    }

    /**
     * Remove a task from the view
     * @param {Integer} task - ID of task to remove
     */
    removeTask(id) {
        
		
		const tbody = this.shadowRoot.querySelector("tbody");
		   const row = tbody.querySelector(`tr[data-id="${id}"]`);
		   if (row) {
		       tbody.removeChild(row);
		
    }}

    /**
     * @public
     * @return {Number} - Number of tasks on display in view
     */
    getNumtasks() {
        
		const tbody = this.shadowRoot.querySelector("tbody");
		return tbody ? tbody.querySelectorAll("tr").length : 0;
		
    }
}
customElements.define('task-list', TaskList);
