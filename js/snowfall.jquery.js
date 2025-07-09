/**
 * =========================================================================================
 * PHẦN 1: POLYFILL CHO requestAnimationFrame
 *
 * Mục đích: Đảm bảo có một hàm để tạo hoạt ảnh mượt mà trên mọi trình duyệt.
 * Nó ưu tiên hàm gốc của trình duyệt, nếu không có sẽ dùng phiên bản cũ hơn hoặc
 * tạo một hàm thay thế bằng setTimeout.
 * =========================================================================================
 */
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz']; // Các tiền tố của trình duyệt cũ

    // Vòng lặp để tìm phiên bản requestAnimationFrame có sẵn
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    // Nếu sau khi tìm mà vẫn không có, tạo một hàm thay thế bằng setTimeout
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime)); // Cố gắng đạt 60fps (1000ms / 60 ≈ 16ms)
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    // Tương tự, tạo hàm cancelAnimationFrame thay thế
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());


/**
 * =========================================================================================
 * PHẦN 2: PLUGIN SNOWFALL CHO JQUERY
 *
 * (function($) { ... })(jQuery); là cách viết một plugin jQuery chuẩn,
 * đảm bảo biến '$' luôn là jQuery.
 * =========================================================================================
 */
(function ($) {
    // Hàm chính của plugin, nơi toàn bộ logic được thực thi
    $.snowfall = function (element, options) {
        // Các tùy chọn mặc định của plugin
        var defaults = {
            flakeCount: 35, // Số lượng bông tuyết/cánh hoa
            flakeColor: '#ffffff', // Màu sắc nếu không dùng ảnh
            flakePosition: 'absolute', // Định vị CSS
            flakeIndex: 999999, // z-index để luôn nổi lên trên
            minSize: 1, // Kích thước tối thiểu
            maxSize: 2, // Kích thước tối đa
            minSpeed: 1, // Tốc độ rơi tối thiểu
            maxSpeed: 5, // Tốc độ rơi tối đa
            round: false, // Bo tròn các góc (nếu không dùng ảnh)
            shadow: false, // Tạo bóng đổ
            collection: false, // Tính năng nâng cao: cho tuyết "đọng" lại trên các phần tử HTML
            collectionHeight: 40,
            deviceorientation: false // Sử dụng cảm biến con quay của điện thoại để điều khiển hướng rơi
        },
            // Gộp tùy chọn người dùng và tùy chọn mặc định
            options = $.extend(defaults, options),
            // Hàm tiện ích tạo số ngẫu nhiên trong một khoảng
            random = function random(min, max) {
                return Math.round(min + Math.random() * (max - min));
            };

        // Lưu trữ đối tượng snowfall vào dữ liệu của phần tử để có thể gọi lại sau (ví dụ: để xóa)
        $(element).data("snowfall", this);

        // --- Bắt đầu định nghĩa đối tượng Flake (Bông tuyết/Cánh hoa) ---
        function Flake(_x, _y, _size, _speed, _id) {
            // Thuộc tính của mỗi cánh hoa
            this.id = _id;
            this.x = _x; // Tọa độ x (ngang)
            this.y = _y; // Tọa độ y (dọc)
            this.size = _size; // Kích thước
            this.speed = _speed; // Tốc độ rơi
            this.step = 0; // Biến dùng để tính toán chuyển động lắc lư
            this.stepSize = random(1, 10) / 100; // Mức độ lắc lư

            // Tạo phần tử HTML cho cánh hoa
            var flakeMarkup = null;
            if (options.image) {
                // Nếu người dùng cung cấp một hình ảnh
                flakeMarkup = $(document.createElement("img"));
                flakeMarkup[0].src = options.image;
            } else {
                // Nếu không, tạo một div với màu nền
                flakeMarkup = $(document.createElement("div"));
                flakeMarkup.css({
                    'background': options.flakeColor
                });
            }

            // Thiết lập các thuộc tính CSS cho cánh hoa
            flakeMarkup.attr({
                'class': 'snowfall-flakes',
                'id': 'flake-' + this.id
            }).css({
                'width': this.size,
                'height': this.size,
                'position': options.flakePosition,
                'top': this.y,
                'left': this.x,
                'fontSize': 0,
                'zIndex': options.flakeIndex
            });

            // Thêm cánh hoa vào trang web
            if ($(element).get(0).tagName === $(document).get(0).tagName) {
                $('body').append(flakeMarkup);
                element = $('body');
            } else {
                $(element).append(flakeMarkup);
            }

            // Lưu trữ tham chiếu đến phần tử DOM để cập nhật nhanh hơn
            this.element = document.getElementById('flake-' + this.id);

            // Hàm cập nhật vị trí của cánh hoa trong mỗi khung hình
            this.update = function () {
                // Cập nhật tọa độ Y (di chuyển xuống dưới)
                this.y += this.speed;

                // Nếu cánh hoa rơi ra khỏi màn hình, gọi hàm reset()
                if (this.y > (elHeight) - (this.size + 6)) {
                    this.reset();
                }

                // Áp dụng vị trí mới vào CSS
                this.element.style.top = this.y + 'px';
                this.element.style.left = this.x + 'px';

                // Cập nhật tọa độ X để tạo hiệu ứng lắc lư qua lại khi rơi
                this.step += this.stepSize;
                if (doRatio === false) {
                    this.x += Math.cos(this.step);
                } else {
                    // Nếu dùng cảm biến con quay, thêm giá trị của nó vào
                    this.x += (doRatio + Math.cos(this.step));
                }

                // Phần logic phức tạp cho tính năng collection (va chạm và đọng lại)
                // Trong trường hợp của bạn, tính năng này không được sử dụng.
                if (options.collection) {
                    // ... (Code xử lý va chạm với canvas)
                }

                // Nếu cánh hoa bay ra khỏi lề trái/phải, reset lại nó
                if (this.x > (elWidth) - widthOffset || this.x < widthOffset) {
                    this.reset();
                }
            }

            // Hàm reset cánh hoa về vị trí ban đầu (ở trên cùng)
            this.reset = function () {
                this.y = 0;
                this.x = random(widthOffset, elWidth - widthOffset);
                this.stepSize = random(1, 10) / 100;
                this.size = random((options.minSize * 100), (options.maxSize * 100)) / 100;
                this.speed = random(options.minSpeed, options.maxSpeed);
            }
        }
        // --- Kết thúc định nghĩa đối tượng Flake ---

        // Khởi tạo các biến
        var flakes = [], // Mảng chứa tất cả các đối tượng Flake
            flakeId = 0,
            i = 0,
            elHeight = $(element).height(),
            elWidth = $(element).width(),
            widthOffset = 0,
            snowTimeout = 0;

        // Đoạn comment gốc từ tác giả
        //素材家园 - www.sucaijiayuan.com

        // Phần khởi tạo cho tính năng collection (không dùng trong trường hợp của bạn)
        if (options.collection !== false) {
            // ... (Code tạo canvas để phát hiện va chạm)
        }

        // Nếu hiệu ứng áp dụng cho cả trang, tạo một khoảng đệm ở lề
        if ($(element).get(0).tagName === $(document).get(0).tagName) {
            widthOffset = 25;
        }

        // Cập nhật lại kích thước khi cửa sổ trình duyệt thay đổi
        $(window).bind("resize", function () {
            elHeight = $(element)[0].clientHeight;
            elWidth = $(element)[0].offsetWidth;
        });

        // Tạo ra các cánh hoa ban đầu dựa trên tùy chọn `flakeCount`
        for (i = 0; i < options.flakeCount; i += 1) {
            flakeId = flakes.length;
            flakes.push(new Flake(
                random(widthOffset, elWidth - widthOffset), // vị trí x ngẫu nhiên
                random(0, elHeight), // vị trí y ngẫu nhiên
                random((options.minSize * 100), (options.maxSize * 100)) / 100, // kích thước ngẫu nhiên
                random(options.minSpeed, options.maxSpeed), // tốc độ ngẫu nhiên
                flakeId
            ));
        }

        // Áp dụng các hiệu ứng tùy chọn khác
        if (options.round) {
            $('.snowfall-flakes').css({
                '-moz-border-radius': options.maxSize,
                '-webkit-border-radius': options.maxSize,
                'border-radius': options.maxSize
            });
        }
        if (options.shadow) {
            $('.snowfall-flakes').css({
                '-moz-box-shadow': '1px 1px 1px #555',
                '-webkit-box-shadow': '1px 1px 1px #555',
                'box-shadow': '1px 1px 1px #555'
            });
        }

        // Xử lý tùy chọn cảm biến con quay
        var doRatio = false;
        if (options.deviceorientation) {
            $(window).bind('deviceorientation', function (event) {
                doRatio = event.originalEvent.gamma * 0.1;
            });
        }

        // Hàm hoạt ảnh chính
        function snow() {
            // Lặp qua tất cả các cánh hoa và gọi hàm update() của chúng
            for (i = 0; i < flakes.length; i += 1) {
                flakes[i].update();
            }
            // Yêu cầu trình duyệt vẽ lại khung hình tiếp theo
            snowTimeout = requestAnimationFrame(function () {
                snow()
            });
        }

        // Bắt đầu hoạt ảnh
        snow();

        // Phương thức công khai để xóa hiệu ứng
        this.clear = function () {
            $(element).children('.snowfall-flakes').remove(); // Xóa các phần tử DOM
            flakes = []; // Xóa mảng các đối tượng
            cancelAnimationFrame(snowTimeout); // Dừng vòng lặp hoạt ảnh
        }
    };

    // Đăng ký plugin vào jQuery để có thể gọi bằng `$(selector).snowfall()`
    $.fn.snowfall = function (options) {
        if (typeof (options) == "object" || options == undefined) {
            // Nếu gọi với một đối tượng tùy chọn, khởi tạo plugin
            return this.each(function (i) {
                (new $.snowfall(this, options));
            });
        } else if (typeof (options) == "string") {
            // Nếu gọi với một chuỗi (ví dụ: 'clear'), thực thi phương thức đó
            return this.each(function (i) {
                var snow = $(this).data('snowfall');
                if (snow) {
                    snow.clear();
                }
            });
        }
    };
})(jQuery);

