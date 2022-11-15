var barcode_wrapper = document.getElementById('op-barcode-wrapper');
var op_scanner = null;
var barcodeDetector = null;
var videoEl = null;
var intervalBarcodeScanner = null;
// check compatibility
if (!("BarcodeDetector" in window)) {
    console.log("Barcode Detector is not supported by this browser.");
} else {
    op_scanner = document.createElement('span');
    op_scanner.setAttribute('class', 'btn btn-primary btn-sm');
    op_scanner.innerText = 'Barcode scanner';


    barcode_wrapper.appendChild(op_scanner);



    op_scanner.addEventListener('click', function() {
      	if(this.getAttribute('scanning') !== null) {
          this.removeAttribute('scanning');
          this.innerText = 'Barcode Scanner';
          clearInterval(intervalBarcodeScanner);
          videoEl.remove();
        }
      	else {
      	  this.innerText = 'Stop';
          this.setAttribute('scanning', '1');
          videoEl = document.createElement('video');
          videoEl.style.width = '300px';
          videoEl.style.height = '300px';
          barcode_wrapper.appendChild(videoEl);

          (async () => {
              const stream = await navigator.mediaDevices.getUserMedia({
                  video: {
                      facingMode: {
                          ideal: "environment"
                      }
                  },
                  audio: false
              });

              videoEl.srcObject = stream;
              await videoEl.play();

              intervalBarcodeScanner = window.setInterval(async () => {
                  const barcodes = await barcodeDetector.detect(videoEl);
                  if (barcodes.length <= 0) return;
                  barcodes.forEach((barcode) => {
                          requestGetJSON('warehouse/wh_get_item_by_barcode/' + barcode.rawValue).done(function(response) {
                              if (response.status == true || response.status == 'true') {
                                  wh_add_item_to_preview(response.id);
                                  alert_float('success', response.message);
                              } else {
                                  alert_float('warning', '<?php echo _l('
                                      no_matching_products_found ') ?>');
                              }
                          });
                      }


                  );
              }, 1000)
          })();
        }


    });

    let formatsSupported = [];
    BarcodeDetector.getSupportedFormats().then((supportedFormats) => {
        supportedFormats.forEach((format) => formatsSupported.push(format));
    }).then(() => {
        barcodeDetector = new BarcodeDetector({
            formats: formatsSupported,
        });

        barcode_wrapper.appendChild(op_scanner);
    });
}
