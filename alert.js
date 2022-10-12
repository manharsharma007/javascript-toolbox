(function (root, factory) {
    "use strict";
    // CommonJS module is defined
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory(require("jquery"), require("bootstrap"));
    }
// AMD module is defined
    else if (typeof define === "function" && define.amd) {
        define("factory", ["jquery", "bootstrap"], function ($) {
            return factory($);
        });
    } else {
// planted over the root!
        root.ZzAlert = factory(root.jQuery);
    }

}(this, function ($) {
    "use strict";

// The actual plugin constructor
    function ZzAlert(options) {
        this.defaults = {alertZIndex : 99999};
        this.options = $.extend({}, this.defaults, options);
        this.allModals = [];
        this.registerGlobalEventsHandler();
    }

    ZzAlert.prototype.messageModal = function (options) {
        var alert = new AlertWrapper(this, options);
        this.allModals.push(alert);

        alert.init();
        return alert;
    };

    var messageContainer =
            "<div class='modal fade' id='' tabindex='-1' role='dialog' aria-labelledby='' aria-hidden='true'>" +
            "<div class='modal-dialog' role='document'>" +
            "<div class='modal-content'>" +
            "</div>" +
            "</div>" +
            "</div>";
    var messageHeader = "<div class='modal-header' style='background:#f8f8f8;'></div>";
    var messageCloseButton =
            "<button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>";
    var messageBody = "<div class='modal-body'></div>";

    var uniqueIdentifier = function (prefix) {
        return prefix + "-" + new Date().getTime() + Math.floor(Math.random() * 100);
    };

    function AlertWrapper(factory, options) {
        this.factory = factory;
        this.options = $.extend(true, {}, {
            id: uniqueIdentifier("ZzAlert"),
            title: null,
            message: null,
            closable: true,
            closeByBackdrop: true,
            closeByKeyboard: true,
            size: null,
            onDestroy: null,
            buttons: [],
            headerClass: null,
            localData: {},
            centered: false,
            modalDialogScrollable: true,
            modalTitleContainer: "<h5 class='modal-title'></h5>",
            modalButtonContainer: "<button id='' type='button' class='zz-1'></button>",
            modalFooterContainer: "<div class='modal-footer d-flex flex-wrap'></div>"
        }, options);

        this.originalModal = null;
        this.isDestroy = false;
        this.isOpen = false;
    }

    AlertWrapper.prototype.generateTemplate = function () {

        this.originalModal = $(messageContainer);

        this.originalModal.attr("id", this.options.id);
        var $dialog = this.originalModal.find(".modal-dialog");
        if (this.options.size && (this.options.size === "modal-sm" || this.options.size === "modal-lg" || this.options.size === "modal-xl")) {
            $dialog.addClass(this.options.size);
        }
        if (this.options.centered === true) {
            $dialog.addClass('modal-dialog-centered');
        }
        if (this.options.modalDialogScrollable === true) {
            $dialog.addClass('modal-dialog-scrollable');
        }

        if (this.options.title || this.options.closable) {
            this.originalModal.find(".modal-content").append(messageHeader);
        }
        if (this.options.title) {
            this.originalModal.find(".modal-header").append(this.options.modalTitleContainer).find(".modal-title").append(this.options.title);
        }
        if (this.options.closable) {
            this.originalModal.find(".modal-header").append(messageCloseButton);
        }

        if (this.options.headerClass) {
            this.originalModal.find(".modal-header").addClass(this.options.headerClass);
        }

        if (this.options.message) {
            this.originalModal.find(".modal-content").append(messageBody);
            this.originalModal.find(".modal-body").html('').append(this.options.message);
        }
        if (this.options.buttons && this.options.buttons.length > 0) {
            this.originalModal.find(".modal-content").append(this.options.modalFooterContainer);
            for (var i = 0; i < this.options.buttons.length; i++) {
                var buttonData = this.options.buttons[i];
                this.addButton(buttonData, false);
            }
        }
    };
    AlertWrapper.prototype.init = function () {
        this.generateTemplate();
        var $this = this;
        this.originalModal.on("show.bs.modal", function (event) {
            // YOU SHOULD STOP PROPAGATION because we register too for global modals.
            event.stopPropagation();
            var zIndex = $this.factory.defaults.alertZIndex + (10 * $(".modal.show").length);
            $(this).css("z-index", zIndex);
            setTimeout(function () {
                $(".modal-backdrop").not(".modal-stack").first().css("z-index", zIndex - 1).addClass("modal-stack");
            }, 0);
        }).on("shown.bs.modal", function (event) {
            $this.isOpen = true;
        }).on("hide.bs.modal", function (event) {
            if ($this.options.onDestroy && (typeof $this.options.onDestroy === "function")) {
                if (!$this.options.onDestroy.call($this, $this)) {
                    event.preventDefault();
                }
            }
        }).on("hidden.bs.modal", function (event) {
            // YOU SHOULD STOP PROPAGATION because we register too for global modals.
            event.stopPropagation();
            $this.destroy();
            $(".modal.show").length && $("body").addClass("modal-open");
        });
    };
    AlertWrapper.prototype.destroy = function () {
        var $this = this;
        this.originalModal.modal("hide").promise().done(function () {
            $this.isOpen = false;
            $("#" + $this.options.id).off("show.bs.modal");
            $("#" + $this.options.id).off("hidden.bs.modal");
            $("#" + $this.options.id).modal("dispose");
            for (var i = 0; i < $this.options.buttons.length; i++) {
                var button = $this.options.buttons[i];
                button.buttonObject.off();
            }

            $this.isDestroy = true;
            var i = $this.factory.allModals.length;
            while (i--) {
                if ($this.factory.allModals[i].options.id === $this.options.id) {
                    $this.factory.allModals.splice(i, 1);
                    break;
                }
            }
            $("#" + $this.options.id).find(".modal-dialog").off();
            $("#" + $this.options.id).off();
            $("#" + $this.options.id).remove();
        });
    };

    AlertWrapper.prototype.show = function () {
        var currentOptions = {
            show: true,
            backdrop: this.options.closeByBackdrop ? true : "static",
            keyboard: this.options.closeByKeyboard,
            focus: true
        };
        var myModal = new bootstrap.Modal(this.originalModal, currentOptions);
        myModal.show();
        return this;
    };
    AlertWrapper.prototype.hide = function () {
        this.originalModal.modal("hide");
    };

    AlertWrapper.prototype.updateTitle = function (newTitle) {
        this.options.title = newTitle;
        var titleElement = this.originalModal.find(".modal-title");
        if (titleElement.length === 0) {
            var headerElement = this.originalModal.find(".modal-header");
            if (headerElement.length === 0) {
                this.originalModal.find(".modal-content").prepend(messageHeader);
                headerElement = this.originalModal.find(".modal-header");
            }
            headerElement.prepend(this.options.modalTitleContainer);
            titleElement = this.originalModal.find(".modal-title");
        }
        titleElement.html(newTitle);
        this.originalModal.modal("handleUpdate");
        return this;
    };

    AlertWrapper.prototype.removeHeader = function () {
        var headerElement = this.originalModal.find(".modal-header");
        if (headerElement.length > 0) {
            var closeButton = headerElement.find("button.btn-close");
            if (closeButton.length > 0) {
                closeButton.off();
                closeButton.remove();
                this.options.closable = false;
            }
            headerElement.remove();
            this.options.title = null;
        }
        this.originalModal.modal("handleUpdate");
        return this;
    };

    AlertWrapper.prototype.updateMessage = function (newMessage) {
        this.options.message = newMessage;
        var bodyElement = this.originalModal.find(".modal-body");
        bodyElement.html("").html(newMessage);
        this.originalModal.modal("handleUpdate");
        return this;
    };
    AlertWrapper.prototype.updateSize = function (newSize) {
        if (this.options.size !== newSize) {
            this.options.size = newSize;
            if (!this.options.size || (typeof this.options.size === "undefined") || this.options.size === null) {
                this.originalModal.find(".modal-dialog").removeClass("modal-xl modal-lg modal-sm");
            } else if (this.options.size === "modal-sm" || this.options.size === "modal-lg" || this.options.size === "modal-xl") {
                this.originalModal.find(".modal-dialog").removeClass("modal-xl modal-lg modal-sm");
                this.originalModal.find(".modal-dialog").addClass(this.options.size);
            }
            this.originalModal.modal("handleUpdate");
        }
        return this;
    };
    AlertWrapper.prototype.disableButtons = function () {
        var footerElement = this.originalModal.find(".modal-footer");
        footerElement.find('button').prop('disabled', true);
    };
    AlertWrapper.prototype.enableButtons = function () {
        var footerElement = this.originalModal.find(".modal-footer");
        footerElement.find('button').prop('disabled', false);
    };
    AlertWrapper.prototype.addButton = function (buttonData, updateOptions) {
        var modalWrapperInstance = this;
        var footerElement = this.originalModal.find(".modal-footer");
        if (footerElement.length === 0) {
            this.originalModal.find(".modal-content").append(this.options.modalFooterContainer);
            footerElement = this.originalModal.find(".modal-footer");
        }
        buttonData.id = buttonData.id ? buttonData.id : uniqueIdentifier("modal-button");
        var buttonHtml = buttonData.template ? buttonData.template : modalWrapperInstance.options.modalButtonContainer;
        var button = $(buttonHtml);
        button.attr("id", buttonData.id);
        button.addClass(buttonData.class ? buttonData.class : "");
        button.append(buttonData.label);
        buttonData.buttonObject = button;
        button.on("click", {AlertWrapper: modalWrapperInstance, button: button, buttonData: buttonData}, function (event) {
            var AlertWrapper = event.data.AlertWrapper;
            var button = event.data.button;
            var buttonData = event.data.buttonData;
            if (buttonData.action && (typeof buttonData.action === "function")) {
                return buttonData.action.call(AlertWrapper, button, buttonData, event);
            }
        });
        if (updateOptions !== false) {
            this.options.buttons.push(buttonData);
        }

        return button.appendTo(footerElement);
    };
    ZzAlert.prototype.confirm = function (options) {
        var defaults = {
            title: "Confirm",
            message: "Are You Sure ?",
            closeByBackdrop: false,
            closeByKeyboard: false,
            buttons: [
                {
                    label: "No",
                    class: "btn btn-danger",
                    action: function (button, buttonData, originalEvent) {
                        this.hide();
                        if (options.onConfirmCancel && (typeof options.onConfirmCancel === "function")) {
                            options.onConfirmCancel();
                        }
                    }
                },
                {
                    label: "Yes",
                    class: "btn btn-success",
                    action: function (button, buttonData, originalEvent) {
                        this.hide();
                        if (options.onConfirmAccept && (typeof options.onConfirmAccept === "function")) {
                            options.onConfirmAccept();
                        }
                    }
                }
            ]
        };
        var confirmOptions = $.extend({}, defaults, options);
        return this.messageModal(confirmOptions).show();
    };
    AlertWrapper.prototype.removeButton = function (buttonId) {

        var requestedButton = null;
        var i = this.options.buttons.length;
        while (i--) {
            if (this.options.buttons[i].id === buttonId) {
                var requestedButton = this.options.buttons[i];
                requestedButton.buttonObject.off();
                requestedButton.buttonObject.remove();
                this.options.buttons.splice(i, 1);
            }
        }
        return this;
    };

    ZzAlert.prototype.registerGlobalEventsHandler = function () {
        // some bootstrap plugins like summernote have problem when run inside a bootstrap modals
        // as native bootstrap modal does support nested modal so we should handle the z-index of those plugins' modals
        // too in the same way we handle the modal wrapper instaces
        var $this = this;
        $(document).on("show.bs.modal", '.modal', function (event) {
            var zIndex = $this.options.alertZIndex + (10 * $(".modal.show").length);
            $(this).css("z-index", zIndex);
            setTimeout(function () {
                $(".modal-backdrop").not(".modal-stack").first().css("z-index", zIndex - 1).addClass("modal-stack");
            }, 0);
        }).on("hidden.bs.modal", '.modal', function (event) {
            $(".modal.show").length && $("body").addClass("modal-open");
        }).on('inserted.bs.tooltip', function (event) {
            var zIndex = $this.options.alertZIndex + (10 * $(".modal.show").length);
            var tooltipId = $(event.target).attr("aria-describedby");
            $("#" + tooltipId).css("z-index", zIndex);
        }).on('inserted.bs.popover', function (event) {
            var zIndex = $this.options.alertZIndex + (10 * $(".modal.show").length);
            var popoverId = $(event.target).attr("aria-describedby");
            $("#" + popoverId).css("z-index", zIndex);
        });

    };

    return new ZzAlert();
}));