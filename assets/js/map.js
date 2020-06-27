$.fn.addReceivers = function(receivers) {
    if (!this.data('map')) {
        this.data('map', new google.maps.Map($('.map .content-container')[0], {
            center: { lat: 30, lng: 0 },
            zoom: 3
        }));
    };
    var map = this.data('map');
    var infowindow;
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
        var title;
        if (r.url) {
            title = '<a href="' + r.url + '" target="_blank">' +
                '<h5><i class="mdi mdi-open-in-new"></i> ' + r.label + '</h5>' +
            '</a>';
        } else {
            title = '<h5>' + r.label + '</h5>';
        }
        receiverSnippet = r.receivers.map(function(ro) {
            return '<div>' +
                '<a href="' + ro.url + '" target="_blank">' +
                    '<i class="mdi mdi-open-in-new"></i> ' +
                    ro.type + (ro.version ? ' ' + ro.version : '')
                '</a>' +
            '</div>';
        }).join('');
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
}