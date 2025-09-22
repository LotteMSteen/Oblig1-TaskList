 class TaskBox extends HTMLElement {

    // private
    #cssfile = "taskbox.css";
    #shadow;
    #taskbox;
    #newtaskCallbacks = new Map();
    #taskCallbackId = 0;

	// constructor for TaskBox

    constructor() {
        super();

        this.#shadow = this.attachShadow({ mode: 'closed' });

        this.#createLink();
        this.#taskbox = this.#createHTML();

        this.#shadow.querySelector("span").addEventListener("click", this.close.bind(this));
        this.#shadow.querySelector("button").addEventListener("click", this.#addtask.bind(this));
    }

	// metoder som skal implementeres
	
	
	setStatuseslist(list) { this.allstatuses = list; }
	addNewtaskCallback(cb) { return this.newtaskCallback(cb); }

    show() {
	
        const inputElm = this.#shadow.querySelector("input");

        inputElm.value = "";

        this.#shadow.querySelector("select").selectedIndex = 0;
        this.#taskbox.classList.remove("hidden");

        const modalwidth = this.#shadow.querySelector("table").getBoundingClientRect().width;
        const closeelmwidth = this.#shadow.querySelector("span").getBoundingClientRect().width;

        this.#shadow.querySelector("div>div").style.width = `${modalwidth + closeelmwidth + 40}px`;

        inputElm.focus();
    }

    set allstatuses(statuslist) {
        
		const select = this.#shadow.querySelector("select");
		
        statuslist.forEach((status, i) => {
            const optelement = document.createElement('option')
            optelement.value = i
            optelement.textContent = status
            select.add(optelement)
        })
    }

    newtaskCallback(callback) {
	
        this.#newtaskCallbacks.set(this.#taskCallbackId, callback);
        const prevId = this.#taskCallbackId;
        ++this.#taskCallbackId;

        return prevId;
    }

    close() {
	
        this.#taskbox.classList.add("hidden");
    }

    #createLink() {
	
        const link = document.createElement('link');
        const path = import.meta.url.match(/.*\//)[0];
        link.href = path.concat(this.#cssfile);
        link.rel = "stylesheet";
        link.type = "text/css";
        this.#shadow.appendChild(link);
    }

    #createHTML() {
	
        const wrapper = document.createElement('div');
        wrapper.classList.add("hidden");

        const content = `
        <!-- Modal content -->
        <div>
            <span>&times;</span>
            <table>
                <tr><th>Title:</th><td><input type="text" size="25" maxlength="80" placeholder="Task title"/></td></tr>
                <tr><th>Status:</th><td><select></select></td></tr>
            </table>
           <p><button type="submit">Add task</button></p>
        </div>
        `;

        wrapper.insertAdjacentHTML('beforeend', content);
        this.#shadow.appendChild(wrapper);

        return wrapper;
    }

    get #task() {
	
        let task = {};
        if (!this.#taskbox.classList.contains("hidden")) {
            task.title = this.#shadow.querySelector("input").value;
            task.status = this.#shadow.querySelector("select").selectedOptions[0].textContent;
        }
        return task;
    }

    #addtask() {
	
        this.#newtaskCallbacks.forEach(
            callback => { callback(this.#task) }
        );
    }
}

export default TaskBox;
customElements.define("task-box", TaskBox);