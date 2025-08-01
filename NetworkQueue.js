class NetworkQueue {
    constructor() {
        this.items = {}
        this.frontIndex = 0
        this.backIndex = 0
        this.queueCleared = true
        this.networkBanner = this.printBanner(false);
    }

    queueRequest(url, data, callback = false) {
        const request = {url : url, data : data, callback: callback};
        this.enqueue(request);
        this.printBanner(true);
        this.clearQueue()
    }

    enqueue(item) {
        this.items[this.backIndex] = item
        this.backIndex++
        return item
    }
    dequeue() {
        if(this.frontIndex == this.backIndex) {
            return null;
        }
        const item = this.items[this.frontIndex]
        delete this.items[this.frontIndex]
        this.frontIndex++
        return item
    }
    peek() {
        return this.items[this.frontIndex]
    }
    get printQueue() {
        return this.items;
    }

    async clearQueue() {
        if(this.frontIndex == this.backIndex) {
            this.queueCleared = false
            this.printBanner(false);
            return null;
        }
        const item = this.dequeue();
        const request = await fetch(item.url, {
            method : "POST",
            body : Object.entries(item.data).reduce((d,e) => (d.append(...e),d), new FormData())
        });
        const response = await request.json();
        if(response.type == "danger") {
            alert_float(response.type, response.message);
        }
        if(item.callback) {
            item.callback(response);
        }
        this.clearQueue();
    }

    printBanner(show = false) {
        if(this.networkBanner === undefined) {
            const msg = document.createElement("div");
            msg.className = "alert alert-light text-center t-0 hide";
            msg.setAttribute("style", "position:fixed;top:0;left:0;width:100%;background:#f8f8f8;box-shadow:0 0 12px #000;")
            msg.textContent = "Syncing the data. Please donot close.";

            document.getElementsByTagName("body")[0].prepend(msg);
            return msg;
        }
        if(show) {
            this.networkBanner.className = "alert alert-light text-center t-0";
        }
        else {
            this.networkBanner.className = "alert alert-light text-center t-0 hide";
        }
    }
}
