$.fn.addReceivers = function(receivers) {
    if (!this.data('map')) {
        this.data('map', new google.maps.Map($('.map .content-container')[0], {
            center: { lat: 0, lng: 0 },
            zoom: 5
        }));
    };
    var map = this.data('map');
    receivers.forEach(function(r) {
        var marker = new google.maps.Marker({
            position: {lat: r.lat, lng: r.lng},
            map: map,
            title: r.title
        });
    });
}