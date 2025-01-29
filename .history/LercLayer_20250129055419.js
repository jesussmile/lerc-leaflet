var LercLayer = L.GridLayer.extend({
  createTile: function (coords, done) {
    var error;
    var tile = L.DomUtil.create('canvas', 'leaflet-tile');
    tile.width = this.options.tileSize;
    tile.height = this.options.tileSize;

    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    var url = 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/' + 'Terrain3D/ImageServer/tile/' + coords.z + '/' + coords.y + '/' + coords.x;

    xhr.open("Get", url, true);
    xhr.send();

    // var that = this;

    xhr.onreadystatechange = function (evt) {
      if (evt.target.readyState == 4 && evt.target.status == 200) {
        tile.decodedPixels = Lerc.decode(xhr.response);
        this.draw(tile);
        done(error, tile);
      }
    }.bind(this);
    
    return tile;
  },

  draw: function (tile) {
    if (!tile.decodedPixels) return;
    
    var width = tile.decodedPixels.width - 1;
    var height = tile.decodedPixels.height - 1;
    var currentMax = parseFloat(slider.noUiSlider.get()[1]);
    var warningThreshold = currentMax - 304.8; // 1000 feet below current max
    var pixels = tile.decodedPixels.pixels[0];
    var mask = tile.decodedPixels.maskData;

    var ctx = tile.getContext('2d');
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;

    for (var i = 0; i < width * height; i++) {
        var j = i + Math.floor(i / width);
        var elevation = pixels[j];
        
        if (mask && !mask[j]) {
            // No data points are transparent
            data[i * 4 + 3] = 0;
            continue;
        }

        // Set full alpha
        data[i * 4 + 3] = 255;

        if (elevation >= currentMax) {
            // Red for danger zone
            data[i * 4] = 255;     // R
            data[i * 4 + 1] = 0;   // G
            data[i * 4 + 2] = 0;   // B
        } 
        else if (elevation >= warningThreshold) {
            // Yellow for warning zone
            data[i * 4] = 255;     // R
            data[i * 4 + 1] = 255; // G
            data[i * 4 + 2] = 0;   // B
        }
        else {
            // Green for safe zone
            data[i * 4] = 0;       // R
            data[i * 4 + 1] = 255; // G
            data[i * 4 + 2] = 0;   // B
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
})
