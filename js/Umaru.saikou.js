var UmaruSlider = {
    ratio: 1280 / 2048,
    current: 0,
    max: 1,
    dragging: false,
    draggingX: 0,
    lastX: 0,

    adjustContainer: function () {
        var winWidth = $(window).width();
        $('#Umaru-cute-container').height(this.ratio * winWidth);
        $('#Umaru-cute-gallery img').width(winWidth);
        $('#Umaru-cute-gallery').css({'transform': 'translate3d(-'+winWidth * this.current+'px, 0, 0)'});
    },

    initialize: function() {
        this.max = $('#Umaru-cute-gallery img').length - 1;
        $('#Umaru-cute-gallery').css('width', (this.max + 2) * 100 + '%');
    },

    slide: function(offset) {
        if (this.dragging)
            return;

        var newCurrent = this.current + offset;

        if (newCurrent < 0)
            newCurrent = 0;

        if (newCurrent > this.max)
            newCurrent = this.max;

        $('#Umaru-cute-gallery').css({'transform': 'translate3d(-'+$(window).width() * newCurrent+'px, 0, 0)'});

        this.current = newCurrent;
    },

    startDragging: function(x) {
        if (this.dragging)
            return;

        this.dragging = true;
        this.draggingX = x;
        this.lastX = x;

        $('#Umaru-cute-gallery').css({'transition-duration': '0s'});
    },

    stopDragging: function(x) {
        if (!this.dragging)
            return;

        if (isNaN(x))
            x = this.lastX;

        this.dragging = false;
        $('#Umaru-cute-gallery').css({'transition-duration': '1s'});

        var delta = -(x - this.draggingX);
        var halfScreen = $(window).width() / 3;

        if (delta > halfScreen) {
            this.slide(1);
        } else if (delta < -halfScreen) {
            this.slide(-1);
        } else {
            this.slide(0);
        }
    },

    dragMove: function(x) {
        if (!this.dragging)
            return;

        this.lastX = x;
        var delta = -(x - this.draggingX);

        var transform = $(window).width() * this.current + delta;

        if (transform < 0)
            transform = 0;

        $('#Umaru-cute-gallery').css({'transform': 'translate3d(-'+transform+'px, 0, 0)'});
    }
};

$(document).ready(function(){
    UmaruSlider.adjustContainer();
    UmaruSlider.initialize();
});

$(window).resize(function() {
    UmaruSlider.adjustContainer();
});

$(document).keydown(function(e) {
    switch (e.which) {
        case 37:
            UmaruSlider.slide(-1);
            break;

        case 39:
            UmaruSlider.slide(1);
            break;

        default:
            return;
    }

    e.preventDefault();
});

$('#Umaru-cute-gallery').mousedown(function(e) {
    if (e.which == 1) {
        UmaruSlider.startDragging(e.pageX);
        e.preventDefault();
    }
}).mouseup(function(e) {
    UmaruSlider.stopDragging(e.pageX);
}).mouseleave(function(e) {
    UmaruSlider.stopDragging(e.pageX);
}).mousemove(function(e) {
    UmaruSlider.dragMove(e.pageX);
}).on('touchstart', function(ejq) {
    var e = ejq.originalEvent;

    if (e.targetTouches.length >= 1) {
        UmaruSlider.startDragging(e.targetTouches[0].pageX);
        e.preventDefault();
    }
}).on('touchend', function(ejq) {
    UmaruSlider.stopDragging(NaN);
}).on('touchmove', function(ejq) {
    var e = ejq.originalEvent;

    if (e.targetTouches.length >= 1) {
        UmaruSlider.dragMove(e.targetTouches[0].pageX);
    }
}).on('touchcancel', function(ejq) {
    UmaruSlider.stopDragging(NaN);
});