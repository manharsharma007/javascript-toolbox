var stageMessage = function(msg, type) {
	let _flash = document.getElementById('flashAlert');

	if(_flash === null) {
		_flash = document.createElement('div');
		_flash.className = 'flashAlert';
		_flash.id = 'flashAlert';
	}

	let _alert = document.createElement('div');
	_alert.className = 'alert ' + type;

	let _icon = document.createElement('div');
	_icon.className = 'icon';

	if(type == 'error') {
		_icon.innerHTML = '✖';
	}
	else if(type == 'warning') {
		_icon.innerHTML = '!';
	}
	else {
		_icon.innerHTML = '✓';
	}

	let _msg = document.createElement('div');
	_msg.className = 'msg';
	_msg.innerHTML = msg;

	let _close = document.createElement('div');
	_close.className = 'close';
	_close.append('✕');

	_close.addEventListener('click', function() {
		_alert.remove();
	});

	_alert.append(_icon, _msg, _close);
	_flash.append(_alert);
	document.body.appendChild(_flash);
}


class popupContainer {

	constructor(defaults = {}) {
		this.defaults = Object.assign({}, this.getDefaults(), defaults);
		this.modalBody = null;
	}

	getDefaults() {
		return {
			'title' : 'PopUP Modal',
			'id' : 'modal_' + Math.floor(Math.random() * 1000) + 1,
			'form' : null,
			'callbacks' : {
				'onSave' : null,
				'onClose' : null
			},
			'contentURL' : null,
			'method' : 'GET',
			'data' : {}
		}
	}

	initialiseCloseBtn(container) {
		let obj = this;
		let close = document.createElement('div');
		close.setAttribute('class', 'close');
		close.innerText = '✕';
		close.addEventListener('click', function() {
			if(obj.defaults.callbacks.onClose !== null
				&& typeof(obj.defaults.callbacks.onClose) === 'function') {
				obj.defaults.callbacks.onClose(obj);
			}
			container.remove();
		})

		return close;
	}

	initialiseForm() {
		let obj = this;
		let form = document.createElement('form');
		form.setAttribute('method', obj.defaults.form.method);
		form.setAttribute('action', obj.defaults.form.action);
		form.enctype = 'multipart/form-data';

		form.addEventListener('submit', function(event) {
			event.preventDefault();
			if(obj.defaults.callbacks.onSave !== null
				&& typeof(obj.defaults.callbacks.onSave) === 'function') {
				obj.defaults.callbacks.onSave(obj);
			}

        	let data = new FormData(obj.modalBody);
			let contentRet = obj.performFetch(data, obj.defaults.form.action, obj.defaults.form.method);
			
		});

		return form;

	}

	async performFetch(data, url, method) {
		let contentRet = await this.fetchContent(data, url, method);
		this.populateBody(contentRet);
	}

	populateBody(contentRet) {
		if(contentRet !== false) {
			const template = new DOMParser().parseFromString(contentRet, 'text/html').body.firstElementChild;
			this.modalBody.innerHTML = '';
			this.modalBody.appendChild(template);
		}
	}

	async fetchContent(data, _url, _method) {
		let options = {
	        method : _method
	    };
	    if ( 'GET' === _method.toUpperCase() ) {
	        _url += '?' + ( new URLSearchParams( data ) ).toString();
	    } else {
	        options.body = data;
	    }
	    
	    let res = await fetch( _url, options );

        if (res.ok) {
            let ret = await res.json();
            return this.parseJson(ret);

        } else {
			stageMessage('Something went wrong, Please try again later.', 'error')
			return false;
        }
	}


	parseJson(response) {
		if(response.hasOwnProperty('message')) {
			stageMessage(response.message.msg, response.message.type);
		}

		if(response.hasOwnProperty('data')) {
			return response.data;
		}
		
		return false;
	}

	show() {
		let container = document.createElement('div');
		container.id = this.defaults.id;
		container.className = 'modal-container';

		let modal = document.createElement('div');
		modal.className = 'modal';

		let head = document.createElement('div');
		head.className = 'modal-head';
		let close = this.initialiseCloseBtn(container);
		head.append(document.createRange().createContextualFragment(`<h5>${this.defaults.title}</h5>`), close);

		let body = document.createElement('div');
		body.className = 'modal-body';

		container.append(modal);
		if(this.defaults.form !== null) {
			let form = this.initialiseForm();
			body.append(form);
			this.modalBody = form;
		}
		else {
			this.modalBody = body;
		}
		
		let content = this.performFetch(this.defaults.data, this.defaults.contentURL, this.defaults.method);

		modal.append(head, body);

		document.body.append(container);
	}

}

class MediaHelper {

	#contentBlocks = {};
	#loadMoreBtn = null;
	#fetchIndex = 0;

	constructor(defaults = {}) {
		this.defaults = Object.assign({}, this.#getDefaults(), defaults);
	}

	#getDefaults() {
		return {
			'id' : 'mediaHelper_' + Math.floor(Math.random() * 1000) + 1,
			'submit' : null,
			'callbacks' : {
				'onSave' : null,
				'onClose' : null,
				'onSelect' : null
			},
			'contentURL' : null,
			'method' : 'GET',
			'data' : null,
			'fetchIndex' : 5
		}
	}

	#prepareTemplate() {
		let template = `<div class="mediaHelperContainer">
							<div class="mu_helper">
								<div class="mu_head">
									<h4 class="title">
										Insert Media
									</h4>
									<div class="mu_btn">
									</div>
									<span class="close">✕</span>
								</div>
								<div class="mu_body">
								</div>
								<div class="mu_foot">
								</div>
							</div>
						</div>`;
		template = new DOMParser().parseFromString(template, 'text/html').body.firstElementChild;
		return template;
	}

	#createElements(elProperties) {
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
					element.addEventListener(_key, function(event) {
						el.callbacks[_key](element);
					});
				}
			}
		    elements.push(element);
		});

		return elements;
	}

	#prepareMediaBtns() {
		let btns = [];
		let obj = this;
		let prepareBtns = [
							{
								'type' : 'button',
								'text' : 'All media',
								'properties' : {
									'class' : 'mu_btn_accordion',
								},
								'callbacks' : {
									'click' : function(element) {
										obj.#contentBlocks.allMedia.style.display = 'grid';
										obj.#contentBlocks.uploadMedia.style.display = 'none';
										obj.#loadMoreBtn.style.display = 'block';
									}
								}
							},
							{
								'type' : 'button',
								'text' : 'Upload new',
								'properties' : {
									'class' : 'mu_btn_accordion',
								},
								'callbacks' : {
									'click' : function(element) {
										obj.#contentBlocks.allMedia.style.display = 'none';
										obj.#contentBlocks.uploadMedia.style.display = 'grid';
										obj.#loadMoreBtn.style.display = 'none';
									}
								}
							},
							{
								'type' : 'button',
								'text' : 'Load more',
								'properties' : {
									'class' : 'mu_loadMore_btn',
								},
								'callbacks' : {
									'click' : function(element) {
										obj.prepareCards(obj.#fetchIndex);
									}
								}
							}
						];
		let [insert, upload, load] = obj.#createElements(prepareBtns);
		obj.#loadMoreBtn = load;
		return [insert, upload];
	}

	#prepareAllMedia() {
		let properties = [{
			'type' : 'div',
			'properties' : {
				'id' : 'allPosts',
				'class' : 'allMedia'
			}
		}];

		return this.#createElements(properties)[0];
	}

	#prepareUploader() {
		let obj = this;
		let properties = [
			{
				'type' : 'div',
				'properties' : {
					'id' : 'uploadForm',
					'class' : 'mediaUploader'
				}
			},
			{
				'type' : 'form',
				'properties' : {
					'id' : 'uploadForm',
					'method' : 'POST',
					'enctype' : 'multipart/form-data',
					'action' : this.defaults.uploadURL
				}
			},
			{
				'type' : 'div',
				'properties' : {
					'class' : 'field'
				}
			},
			{
				'type' : 'label',
				'text' : 'Choose a file',
				'properties' : {
					'for' : 'finput'
				}
			},
			{
				'type' : 'input',
				'properties' : {
					'class' : 'field',
					'type' : 'file',
					'id' : 'finput',
					'name' : 'media_file',
					'accept' : 'image/*'
				},
			},
		];

		let [uploadForm, form, field, label, input] = this.#createElements(properties);

		input.addEventListener('change', function() {
			label.innerText = input.value
			let data = new FormData();
			data.append('media_file', input.files[0]);

			let response = obj.fetchContent(data, form.action, form.method);
			label.innerText = 'Choose a file';
		});

		field.append(label, input);
		form.append(field);
		uploadForm.append(form);
		return uploadForm;
	}

	generateCard(card) {
		let obj = this;
		let properties = [{
			'type' : 'li',
			'html' : '<img src="imageRender/'+card.media+'"/>'
		}];

		if(obj.defaults.callbacks.onMediaSelect !== null && typeof(obj.defaults.callbacks.onMediaSelect) === 'function') {
			properties.callbacks = {
				'click' : function(element) {
					obj.defaults.callbacks.onMediaSelect(card.media);
				}
			}
		}

		card = obj.#createElements(properties)[0];
		return card;
	}

	prepareContentBlocks(template) {
		let prepareAllMedia = this.#prepareAllMedia();
		let prepareUploader = this.#prepareUploader();
		let prepareMediaBtns = this.#prepareMediaBtns();

		this.#contentBlocks['allMedia'] = prepareAllMedia;
		this.#contentBlocks['uploadMedia'] = prepareUploader;

		template.querySelector('.mu_btn').append(...prepareMediaBtns);
		template.querySelector('.mu_body').append(prepareAllMedia, prepareUploader);
		template.querySelector('.mu_foot').append(this.#loadMoreBtn);
		template.querySelector('.close').addEventListener('click', function() {
			template.remove();
		});

		document.body.append(template);
	}


	async fetchContent(data, _url, _method) {
        let options = {
	        method : _method,
	    };
	    if ( 'GET' === _method.toUpperCase() && data != null) {
	        _url += '?' + ( new URLSearchParams( data ) ).toString();
	    } else if('POST' === _method.toUpperCase()) {
	        options.body = data;
	    }
	    
	    let res = await fetch( _url, options );
        if (res.ok) {
            let ret = await res.json();
            return this.parseJson(ret);

        } else {
			stageMessage(res.status, 'error')
			return false;
        }
	}

	parseJson(response) {
		if(response.hasOwnProperty('message')) {
			stageMessage(response.message.msg, response.message.type);
		}
		
		if(response.hasOwnProperty('data')) {
			return response.data;
		}
		
		return false;
	}


	async prepareCards(clearPrevious = true) {
		let obj = this;
		let allMedia = await this.fetchContent(null, this.defaults.contentURL + '/' + obj.#fetchIndex, this.defaults.method);
		if(allMedia !== false) {

			if(allMedia.media.length < 10) {
				obj.#loadMoreBtn.remove();
			}
			allMedia.media.forEach(function (value) {
				obj.#contentBlocks.allMedia.append(obj.generateCard(value));
			});
		}
		obj.#fetchIndex += 10;

	}

	init() {
		let template = this.#prepareTemplate();
		let obj = this;
		this.prepareContentBlocks(template);

		this.prepareCards();
	}
}



$('.js-menu').click(function() {
	$('.js-menu').removeClass('active');
	$('.column').removeClass('active');

	$(this).addClass('active');
	$('#' + $(this).attr('data-id')).addClass('active');
});

$('.popupForm').click(function() {
	let defaults = {
		'title' : 'Add class',
		'form' : {
			method: 'post',
			action:$(this).attr('data-href')
		},
		'callbacks' : {
			'onClose' : function() {
				window.location.reload();
			},
		},
		'contentURL' : $(this).attr('data-href'),
		'method' : 'GET'
	};
	let popup = new popupContainer(defaults).show();
});