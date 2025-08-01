class Select {
	#container = null;
	#searchContainer = null;
	#searchInput = null;
	#resultContainer = null;
	defaults = {};
	resultSet = {};
	selectedValue = null;
	#watcher = null;
	controller = null;

	constructor(defaults = {}) {
		this.defaults = Object.assign({}, this.getDefaults(), defaults);
		return this;
	}

	getDefaults = () => {
		return {
			'id' : 'select_' + Math.floor(Math.random() * 1000) + 1,
			ajax : false,
			ajaxOptions : {
				url : null,
				cache : true,
				data : {},
				method : "GET"
			},
			serverSide : false,
			dataset : [],
			enableSearch : true,
			ajaxSearch : false,
			showSearchBox : false,
			callbacks : {
				onError : null,
				onItemSelect : null,
				onClose : null,
			}
		}
	}

	initialise = () => {
		this.prepareContainers();
		if(this.defaults.ajax == true) {
			if(this.defaults.ajaxSearch == false) {
				this.performFetch(this.defaults.ajaxOptions.data, this.defaults.ajaxOptions.url, this.defaults.ajaxOptions.method);
			}
		}
		else {
			this.addItemsToResult(this.defaults.dataset);
		}
		return this;
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

			if(el.hasOwnProperty('callbacks')) {
				for(const [_key, _value] of Object.entries(el.callbacks)) {
					element.addEventListener(_key, async function(event) {
						if(el.callbacks[_key].constructor.name == 'AsyncFunction') {
							await el.callbacks[_key](obj, this);
						}
						else {
							el.callbacks[_key](obj, this);
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
								'type' : 'div',
								'properties' : {
									'class' : 'rz-selectpicker shadow',
									'id' : obj.defaults.id
								}
							},
							{
								'type' : 'div',
								'properties' : {
									'class' : 'rz-search-wrapper',
								}
							},
							{
								'type' : 'div',
								'properties' : {
									'class' : 'rz-search-result',
								}
							},
							{
								'type' : 'ul'
							}
						];

		let [container, searchContainer, resultContainer, ul] = obj.#createElements(containerProperties);

		resultContainer.append(ul);
		container.append(searchContainer);
		container.append(resultContainer);

		obj.#container = container;
		obj.#resultContainer = ul;
		obj.#searchContainer = searchContainer;


		if(obj.defaults.enableSearch) {
			let searchProps = [{
									'type' : 'input',
									'placeholder' : 'Search here',
									'properties' : {
										'class' : 'form-control',
									}
								}]
			let [searchInput] = obj.#createElements(searchProps);
			obj.#searchInput = searchInput;

			searchInput.addEventListener('input', function(e) {
				if(obj.defaults.ajaxSearch == true && this.value.length > 3) {
					obj.performFetch({q : this.value}, obj.defaults.ajaxOptions.url, obj.defaults.ajaxOptions.method);
				}
				else obj.prepareResultSet(this.value);
			})
		}
		if(obj.defaults.enableSearch && obj.defaults.showSearchBox) {
			obj.#searchContainer.append(obj.#searchInput);
		}

		document.addEventListener('click',function(e) {
			if(e.target != obj.#container && !obj.#container.contains(e.target)) {
				obj.reset();
			}
		}, true);

		return obj;

	}

	addItemsToResult = (items) => {
		var obj = this;
		while (obj.#resultContainer.firstChild) {
			obj.#resultContainer.removeChild(obj.#resultContainer.firstChild);
		}

		// append items to the ul container
		items.forEach((item) => {
			let props = [
					{
						'type' : 'li',
						'text' : item.text,
						'properties' : {
							'data-value' : item.id
						},
						'callbacks' : {
							"click" :  async function(obj) {
								obj.reset();
								obj.#watcher.dispatchEvent(new CustomEvent("onItemSelect", {detail : item}));
								if(obj.defaults.callbacks.onItemSelect != null && obj.defaults.callbacks.onItemSelect != undefined) {
									obj.defaults.callbacks.onItemSelect(obj, item, this);
								}
								obj.#watcher.value = item.text;
							}
						}
					}
				];
			let [li] = obj.#createElements(props);
			if(item.hasOwnProperty("subtext")) {
				if(!Array.isArray(item.subtext)) {
					item.subtext = [item.subtext];
				}
				let elTemplate = item.subtext.map((i) => {
					return {
						'type' : 'span',
						'text' : i,
						'properties' : {
							'class' : 'subtext'
						}
					};
				})
				let span = obj.#createElements(elTemplate);
				li.append(...span);
			}
			obj.#resultContainer.append(li);
		});
	}

	async performFetch(data, contentURL, method) {
		let contentRet = await this.fetchContent(data, contentURL, method);
		this.#resultContainer.innerHTML = '';
		if(contentRet == false) {
			this.#resultContainer.append('You are not allowed to perform this action. Please contact the administrator.');
		}
		else {
			this.addItemsToResult(contentRet);
		}
	}

	async fetchContent(data, _url, _method) {
		if(this.controller == null) {
			this.controller = new AbortController();
		}
		else {
			this.controller.abort();
			this.controller = new AbortController();
		}
		let options = {
	        method : _method,
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			signal : this.controller.signal
	    };
	    if ( 'GET' === _method.toUpperCase() ) {
	        _url += '?' + ( new URLSearchParams( data ) ).toString();
	    } else {
	        options.body = data;
	    }
	    try {
			let res = await fetch( _url, options );
			
			if (res.ok) {
				let ret = await res.json();
				this.resultSet = ret;
				return ret;

			} else {
				if(this.defaults.callbacks.onError !== null
					&& typeof(this.defaults.callbacks.onError) === 'function') {
					this.defaults.callbacks.onError('Something went wrong, Please try again later.', 'error');
				}
				return false;
			}
		}
		catch(e) {
			console.log(e);
			return false;
		}
	}

	prepareResultSet = (value) => {
		let children = this.#resultContainer.childNodes;

		for (const node of children) {
			if(node.innerText.toLowerCase().includes(value.toLowerCase())) {
				node.style.display = 'block';
			}
			else {
				node.style.display = 'none';
			}
		}
	}

	reset = () => {
		var obj = this;
		if(obj.defaults.enableSearch) {
			obj.#searchInput.value = "";
		}
		if(obj.defaults.callbacks.onClose != null && obj.defaults.callbacks.onClose != undefined) {
			obj.defaults.callbacks.onClose(obj);
		}
		obj.prepareResultSet("");
		obj.#container.remove();
	}

	watch = (element, searchable = false) => {
		var obj = this;
		if(searchable) {
			element.addEventListener('input', function(e) {
				obj.#searchInput.value = this.value;
				obj.#searchInput.dispatchEvent(new Event("input"));
			})
		}

		element.addEventListener("click", function(e) {
			obj.#watcher = element;
			element.insertAdjacentElement("afterend", obj.#container);
			if(!searchable) {
				obj.#searchInput.focus({ focusVisible: true });
			}
		});
	}
}