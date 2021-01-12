$.fn.addReceivers = function(receivers) {
    if (!this.data('map')) {
        this.data('map', new google.maps.Map($(this)[0], {
            center: { lat: 30, lng: 0 },
            zoom: 3
        }));
    };
    var map = this.data('map');
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push($(".receiverfilter")[0]);
    var infowindow;
    var bounds = new google.maps.LatLngBounds();
    receivers.forEach(function(r) {
        var position = {
            lng: r.location.coordinates[0],
            lat: r.location.coordinates[1]
        };
        var marker = new google.maps.Marker({
            position: position,
            map: map,
            title: r.label
        });
        bounds.extend(position);

        var title;
        var receiverSnippet;
        if (r.url) {
            title = '<a href="' + r.url + '" target="_blank">' +
                '<h5><i class="mdi mdi-open-in-new"></i> ' + r.label + '</h5>' +
            '</a>';
            receiverSnippet = r.receivers.map(function(ro) {
                return '<div>' +
                    ro.type + (ro.version ? ' ' + ro.version : '') +
                '</div>'
            }).join('');
        } else {
            title = '<h5>' + r.label + '</h5>';
            receiverSnippet = r.receivers.map(function(ro) {
                return '<a href="' + ro.url + '" target="_blank">' +
                     '<div>' +
                        '<i class="mdi mdi-open-in-new"></i> ' +
                        ro.label +
                    '</div>' +
                    '<div>' +
                        ro.type + (ro.version ? ' ' + ro.version : '') +
                    '</div>' +
                '</a>';
            }).join('');
        }
        var info = '<div class="infobox">' +
            title +
            receiverSnippet +
        '</div>';
        marker.addListener('click', function(){
            if (!infowindow) {
                infowindow = new google.maps.InfoWindow();
            }
            infowindow.setContent(info);
            infowindow.open(map, marker);
        });
    });

    // zoom and center map to show all markers
    map.fitBounds(bounds);
}