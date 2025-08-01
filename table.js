class Table {
    header = [];
    column = [];
    #table = null;
    #head = null;
    #body = null;
    #foot = null;
	#colgroup = null;
	dataset = [];
	nVisible = 50;
    maxRows = 5000;
	rowHeight = 50; // initial guess of row height
	topEl = null;
	BottomEl = null;
	topIndex = 0;
	bottomIndex = this.nVisible - 1;

	constructor(defaults = {}) {
		this.defaults = Object.assign({}, this.getDefaults(), defaults);
        this.header = this.defaults.header;
        this.prepareContainers();
        this.initialiseHeader(this.header);
        this.initialiseBody(this.defaults.data);
		if(this.defaults.colgroup.length > 0) {
        	this.initialiseColgroup(this.defaults.colgroup);
		}
		
		return this;

	}

	getDefaults = () => {
		return {
            container : null,
            properties : {
                'class' : 'table border invoice-items-table',
			    'id' : 'select_' + Math.floor(Math.random() * 1000) + 1,
            },
			data : [],
            header : [],
            column : [],
			colgroup : []
		}
	}

    #createElements(elProperties) {
		let obj = this;
		let elements = [];

		elProperties.forEach(function (el) {
			let element = document.createElement(el.type);
			if(el.hasOwnProperty('text')) {
				element.innerText = el.text;
			}
			if(el.hasOwnProperty('html')) {
				element.innerHTML = el.html;
			}
			if(el.hasOwnProperty('properties')) {
				for (const [key, value] of Object.entries(el.properties)) {
			  		element.setAttribute(key, value);
				}
			}
			if(el.hasOwnProperty('nested')) {
				element.append(...obj.#createElements(el.nested));
			}

			if(el.hasOwnProperty('callbacks')) {
				for(const [_key, _value] of Object.entries(el.callbacks)) {
					element.addEventListener(_key, async function(event) {
						if(el.callbacks[_key].constructor.name == 'AsyncFunction') {
							await el.callbacks[_key](obj, this, event);
						}
						else {
							el.callbacks[_key](obj, this, event);
						}
					});
				}
			}
		    elements.push(element);
		});

		return elements;
	}

	prepareContainers() {
		let obj = this;
		//container
		let containerProperties = [
							{
								'type' : 'table',
								'properties' : {
									'class' : obj.defaults.properties.class,
									'id' : obj.defaults.properties.id == undefined ? 'table_' + Math.floor(Math.random() * 1000) + 1 : obj.defaults.properties.id
								}
							},
							{
								'type' : 'colgroup'
							},
							{
								'type' : 'thead'
							},
							{
								'type' : 'tbody'
							},
							{
								'type' : 'tfoot'
							}
						];

		let [table, colgroup, thead, tbody, tfoot] = obj.#createElements(containerProperties);

		table.append(colgroup);
		table.append(thead);
		table.append(tbody);
		table.append(tfoot);
		obj.defaults.container.append(table);
        
        obj.#body = tbody;
        obj.#head = thead;
        obj.#colgroup = colgroup;
        obj.#foot = tfoot;

		obj.defaults.container.addEventListener("scroll", (event) => { 
			obj.computeVisibleRows(obj.defaults.container, obj.#body.rows[parseInt(obj.#body.rows.length / 2) - 1 ], obj.#body.rows[obj.topIndex + 1]);
		})
	}

	initialiseColgroup = (colgroup) => {
        let obj = this;
        let elements = obj.#createElements(colgroup);
        obj.#colgroup.append(...elements);

        return obj;
	}

    initialiseHeader = (header) => {
        let obj = this;
        let [tr] = obj.#createElements([
            {
                'type' : 'tr'
            }
        ]);
        header.forEach((head) => {
			if(typeof head == "string") {
				let [el] = obj.#createElements([
					{
						'type' : 'th',
						'text' : head
					}
				]);
            	tr.append(el);
			}
			else {
				let [el] = obj.#createElements([head]);
            	tr.append(el);
			}
        })

        obj.#head.append(tr)
        return obj;
    }

	initialiseFooter = (footer) => {
        let obj = this;
        footer.forEach((row) => {
            let [tr] = obj.#createElements([
                {
                    'type' : 'tr'
                }
            ]);
            let elements = obj.#createElements(row);
            tr.append(...elements);

            obj.#foot.append(tr)
        })

        return obj;
	}

    initialiseBody = (body) => {
        let obj = this;
        body.forEach((row) => {
			obj.appendDataset(row);
        });
        return obj;
    }

	addRow = (data) => {
        let obj = this;
        data.forEach((row) => {
            let [tr] = obj.#createElements([
                {
                    'type' : 'tr',
					properties : {
						draggable : true
					},
					callbacks : {
						dragstart : (_, el, e) => el.classList.add("dragged"),
						dragend : (_, el, e) => el.classList.remove("dragged"),
						dragover : (_, el, e) => obj.dragover(e)
					}
                }
            ]);
            let elements = obj.#createElements(row);
            tr.append(...elements);

            obj.#body.append(tr)
			console.log(row)
			obj.appendDataset(row);
        })

        return obj;
	}
	
	dragover = (e) => {
		let row = document.querySelector('.dragged'); 
		let children= Array.from(e.target.closest("tr").parentNode.children);
		
		if(children.indexOf(e.target.closest("tr"))>children.indexOf(row)) {
			e.target.closest("tr").after(row);
		}
		else {
			e.target.closest("tr").before(row);
		}
	}

	clear = () => {
		this.#body.replaceChildren();
		this.dataset = [];
		return;
	}

	initialiseDataset = (data) => {
		let obj = this;
		obj.dataset.push(...data);
		// get first n elements and populate them
		for(let i = 0; i < obj.nVisible; i++) {
			if(obj.dataset[i]) {
				let [tr] = obj.#createElements([
					{
						'type' : 'tr',
						properties : {
							draggable : true
						},
						callbacks : {
							dragstart : (_, el, e) => el.classList.add("dragged"),
							dragend : (_, el, e) => el.classList.remove("dragged"),
							dragover : (_, el, e) => obj.dragover(e)
						}
					}
				]);
				let elements = obj.#createElements(obj.dataset[i]);
				tr.append(...elements);
				obj.#body.append(tr);
			}
		}
	}

	length = () => {
		return this.dataset.length;
	}

	getDataset = () => {
		return this.dataset;
	}

	appendDataset = (row) => {
		this.dataset.push(row);
	}

	removeDataset = (index) => {
		this.dataset.splice(index, 1);
	}

	computeVisibleRows = (parent, lasetEl, firstEl) => {
		// let topElementPosition = firstEl.getBoundingClientRect();
		let bottomElementPosition = lasetEl.getBoundingClientRect();

		let parentElementPosition = parent.getBoundingClientRect();
		let obj = this;
		
		if(bottomElementPosition.top < parentElementPosition.top + parent.offsetHeight) {
			// get first n elements and populate them
			for(let i = 0; i < obj.nVisible; i++) {
				if(obj.dataset[i]) {
					let [tr] = obj.#createElements([
						{
							'type' : 'tr',
							properties : {
								draggable : true
							},
							callbacks : {
								dragstart : (_, el, e) => el.classList.add("dragged"),
								dragend : (_, el, e) => el.classList.remove("dragged"),
								dragover : (_, el, e) => obj.dragover(e)
							}
						}
					]);
					let elements = obj.#createElements(obj.dataset[lasetEl.rowIndex + i]);
					tr.append(...elements);
					obj.#body.append(tr);
				}
			}
		}

		// else if(topElementPosition.top - lasetEl.offsetHeight  > parentElementPosition.top) {
		// 	// remove bottom element
		// 	let [tr, td] = obj.#createElements([
		// 		{
		// 			'type' : 'tr',
		// 			properties : {
		// 				draggable : true
		// 			},
		// 			callbacks : {
		// 				dragstart : (_, el, e) => el.classList.add("dragged"),
		// 				dragend : (_, el, e) => el.classList.remove("dragged"),
		// 				dragover : (_, el, e) => obj.dragover(e)
		// 			}
		// 		},
		// 		{
		// 			'type' : 'td',
		// 			properties : {
		// 				colspan : obj.dataset[0].length
		// 			}
		// 		}
		// 	]);

		// 	let elements = obj.#createElements(obj.dataset[lasetEl.rowIndex]);
		// 	tr.append(...elements);
		// 	lasetEl.replaceWith(tr);
		// 	firstEl.replaceChildren();
		// 	firstEl.append(td);

		// 	lasetEl = obj.#body.rows[lasetEl.rowIndex + 1];
		// 	firstEl = obj.#body.rows[firstEl.rowIndex + 1];
		// }
		
		return true;
	}
}