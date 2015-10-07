/*!
 * jCider v3.0.3 (http://pratinav.tk/jCider)
 * (c) 2015 Pratinav Bagla (http://pratinav.tk)
 * Released under the MIT License (https://github.com/Pratinav/jCider/blob/master/LICENSE.txt)
 **/

(function($){

	/**
	* Get DOM element from selector
	*/
	function getElementString(arr, content) {
		if (content===undefined) {
			content = '';
		}
		var tag = '',
			classes = '',
			id = '',
			current = 'tag';
		for (var x = 0; x < arr.length; x++) {
			var ch = arr[x];
			if (ch==='.') {
				classes += x>1 ? ' ' : '';
				current = 'class';
				continue;
			} else if (ch === '#') {
				current = 'id';
				continue;
			}
			if (current === 'tag') {
				tag += ch;
			} else if (current === 'class') {
				classes += ch;
			} else if (current==='id') {
				id += ch;
			}
		}
		el = '<'+tag;
		if (id !== '') el += ' id=\"'+id+'\"';
		if (classes !== '') el += ' class=\"' + classes + '\"';
		el += '>'+content+'</'+tag+'>';
		return el;
	}

	/**
	* Detect IE
	*/
	function detectIE() {
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf("MSIE ");
		var version = parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));

		return (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) ? true : false;
	}

	/**
	* Detect if 3dtransfroms are supported
	*/
	function check3d() {
		if (!window.getComputedStyle) {
			return false;
		}
		var el = document.createElement('p'),
			check,
			transforms = {
			'webkitTransform':'-webkit-transform',
			'OTransform':'-o-transform',
			'msTransform':'-ms-transform',
			'MozTransform':'-moz-transform',
			'transform':'transform'
			};
		document.body.insertBefore(el, null);
		for (var t in transforms) {
			if (el.style[t] !== undefined) {
				el.style[t] = "translate3d(1px,1px,1px)";
				check = window.getComputedStyle(el).getPropertyValue(transforms[t]);
			}
		}
		document.body.removeChild(el);
		return (check !== undefined && check.length > 0 && check !== "none");
	}

	$.fn.jcider = function (settings) {

		/**
		* Declare all settings
		*/
		var config = $.extend({
			looping: true,
			visibleSlides: 1,
			variableWidth: false,
			variableHeight: true,
			fading: false,
			easing: 'cubic-bezier(.694, .0482, .335, 1)',
			transitionDuration: 400,
			autoplay: false,
			slideDuration: 3000,
			controls: true,
			controlsWrapper: 'div.jcider-nav',
			controlsLeft: ['span.jcider-nav-left', ''],
			controlsRight: ['span.jcider-nav-right', ''],
			pagination: true,
			paginationWrapper: 'div.jcider-pagination',
			paginationPoint: 'div.jcider-pagination-point'
		}, settings);


		return this.each(function(){


			/**
			* Declare all variables
			*/
			var $window = $(window),
				$wrapper = $(this),
				$slideWrap = $wrapper.children(),
				$slides = $slideWrap.children(),
				slideCount = $slides.length,
				$controls,
				$controlsLeft,
				$controlsRight,
				$pagination,
				$paginationPoints,
				$current,
				currentWidth,
				currentHeight,
				initPos = false,
				fallback = check3d(),
				ie = detectIE(),
				pause = false,
				offset = [],
				auto = false;


		    /**
		    * Styles
		    */
			$wrapper.css({
				'position': 'relative',
				'overflow': 'hidden',
				'transition': 'all '+config.transitionDuration+'ms',
				'min-width': parseInt($slides.css('width'))*config.visibleSlides + 'px'
			});

			$slideWrap.css({
				'position': 'relative',
				'height': '100%'
			});

			if (config.fading) {
				$slideWrap.css({
					'width': '100%'
				});
				$slides.css({
					'position': 'absolute'
				}).not(0).fadeOut();
			} else {
				$slideWrap.css({
					'width': calcWidth()+'px',
					'transition': 'all '+config.transitionDuration+'ms '+config.easing,
					'left': '0',
					'transform': 'translate3d(0,0,0)',
					'cursor': 'move',
					'-webkit-backface-visibility': 'hidden',
					'-moz-backface-visibility': 'hidden',
					'-ms-backface-visibility': 'hidden',
					'backface-visibility': 'hidden',
					'-webkit-perspective': '1000',
					'-moz-perspective': '1000',
					'-ms-perspective': '1000',
					'perspective': '1000'
				});

				$slides.css({
					'display': 'inline-block',
					'float': 'left'
				});
			}


			/**
			* Calculate width and offset of all slides
			*/
			function calcWidth() {
				var width = 0;
				offset = [];
				for (var x = 0; x < slideCount; x++) {
					offset[x] = width;
					width+= $slides.eq(x).outerWidth();
				}
				return width;
			}


			/**
			* Initialize nav
			*/
			function initControls() {
				var element = config.controlsWrapper.split('');
				$wrapper.append(getElementString(element));
				$controlsWrapper = $wrapper.find(config.controlsWrapper);
				$controlsWrapper.append(getElementString(config.controlsLeft[0].split(''), config.controlsLeft[1]));
				$controlsWrapper.append(getElementString(config.controlsRight[0].split(''), config.controlsRight[1]));
				$controlsLeft = $controlsWrapper.find(config.controlsLeft[0]);
				$controlsRight = $controlsWrapper.find(config.controlsRight[0]);
				if (config.pagination !== true) {
					$controlsWrapper.hide();
				}
			}


			/**
			* Initialize pagination
			*/
			function initPagination() {
				var pagWrap = getElementString(config.paginationWrapper.split(''));
				$wrapper.append(pagWrap);
				$pagination = $wrapper.find(config.paginationWrapper);
				var pagPoint = getElementString(config.paginationPoint.split(''));
				for (var x = 0; x < Math.ceil(slideCount/config.visibleSlides); x++) {
					$pagination.append(pagPoint);
				}
				$paginationPoints = $pagination.children(config.paginationPoint);
				if (config.pagination !== true) {
					$pagination.hide();
				}
			}


			/**
			* Move to slide
			* @param index: Index of desired slide
			*/
			function moveTo(index) {
				if (!config.looping) {
					if (index+(config.visibleSlides-1) > slideCount-1 || index < 0) {
						return;
					}

					if ($controlsLeft.hasClass('disabled')) {
						$controlsLeft.removeClass('disabled');
					}
					if ($controlsRight.hasClass('disabled')) {
						$controlsRight.removeClass('disabled');
					}

					if (index === 0) {
						$controlsLeft.addClass('disabled');
					} else if(index===slideCount-1) {
						$controlsRight.addClass('disabled');
					}
				}


				var $prev;
				if (initPos) {
					$prev = $slides.filter('.active');
					if ($prev.index()===index) return;
					$prev.removeClass('active');
					if (config.pagination) {
						$paginationPoints.filter('.active').removeClass('active');
					}
				}
				if (index < 0) {
					index = slideCount-1;
				} else if (index+(config.visibleSlides-1) > slideCount-1) {
					index = 0;
				}
				$current = $slides.eq(index);
				if (config.visibleSlides===1) {
					if (config.variableHeight) {
						currentHeight = $current.height();
						$wrapper.css({
							'height': currentHeight+'px'
						});
					}
					if (config.variableWidth) {
						currentWidth = $current.width();
						$wrapper.css({
							'width': currentWidth+'px'
						});
					}
				}
				if (config.pagination) {
					var nextPoint = config.visibleSlides === 1 ? index :Math.floor((index+config.visibleSlides >= slideCount ? slideCount : index)/config.visibleSlides);
					$paginationPoints.eq(nextPoint).addClass('active');
				}
				$current.addClass('active');
				if (config.fading) {
					if (initPos) {
						$prev.fadeOut(config.transitionDuration);
					}
					$current.fadeIn(config.transitionDuration);
				} else {
					nextOffset = offset[index];
					if (fallback) {
						$slideWrap.css({
							'left': '-'+nextOffset+'px'
						});
					} else {
						$slideWrap.css({
							'-webkit-transform': 'translate3d('+nextOffset +'px,0, 0)',
							'-moz-transform': 'translate3d('+nextOffset +'px,0, 0)',
							'transform': 'translate3d('+nextOffset +'px,0, 0)'
						});
					}
				}
				if (!initPos) {
					initPos = true;
				}
			}


			/**
			* Move to next slide (to right)
			*/
			function next() {
				moveTo($current.index()+1);
			}


			/**
			* Move to previous slide (to left)
			*/
			function prev() {
				moveTo($current.index()-1);
			}


			/**
			* Switch autoplay on
			*/
			function play() {
				if (!config.autoplay) {
					config.autoplay = true;
				}
				if (pause) {
					pause = false;
					return;
				}
				setTimeout(function() {
					next();
					play();
				},config.slideDuration);
			}


			/**
			* Switch autoplay off
			*/
			function stopPlay() {
				if (config.autoplay) {
					config.autoplay = false;
				}
				if (!pause) {
					pause = true;
				}
			}


			/**
			* Toggle between switching autoplay on/off
			*/
			function togglePlay(){
				if (!pause) {
					stopPlay();
				} else {
					pause = false;
					play();
				}
			}


			/**
			* Hide nav
			*/
			function hideControls() {
				if (config.controls) {
					config.controls = false;
				}
				if ($controlsWrapper.css('display') !== 'none') {
					$controlsWrapper.hide();
				}
			}


			/**
			* Show nav
			*/
			function showControls() {
				if (!config.controls) {
					config.controls = true;
				}
				if ($controlsWrapper.css('display') === 'none') {
					$controlsWrapper.show();
				}
			}


			/**
			* Toggle between disabling/enabling nav
			*/
			function toggleControls() {
				if (config.controls) {
					config.controls = false;
				} else {
					config.controls = true;
				}
				if ($controlsWrapper.css('display') !== 'none') {
					$controlsWrapper.hide();
				} else {
					$controlsWrapper.show();
				}
			}


			/**
			* Hide pagination
			*/
			function hidePagination() {
				if (config.pagination) {
					config.pagination = false;
				}
				if ($pagination.css('display') !== 'none') {
					$pagination.hide();
				}
			}


			/**
			* Show pagination
			*/
			function showPagination() {
				if (!config.pagination) {
					config.pagination = true;
				}
				if ($pagination.css('display') === 'none') {
					$pagination.show();
				}
			}


			/**
			* Toggle between disabling/enabling pagination
			*/
			function togglePagination() {
				if (config.pagination) {
					config.pagination = false;
				} else {
					config.pagination = true;
				}
				if ($pagination.css('display') !== 'none') {
					$pagination.hide();
				} else {
					$pagination.show();
				}
			}


			/**
			* Initialize slider
			*/
			function init() {
				initControls();
				initPagination();
				moveTo(0);

				if (config.autoplay) {
					play();
				}
			}
			init();


			/**
			* Event handler for click on pagination points
			*/
			$paginationPoints.on('click', function(e) {
				e.stopPropagation();
				var index = $(this).index();
				index = index+(config.visibleSlides-1) >= slideCount-1 ? slideCount-config.visibleSlides :config.visibleSlides*index;
				moveTo(index);
				return false;
			});


			/**
			* Event handler for click on left-nav
			*/
			$controlsLeft.on('click', function(e) {
				e.stopPropagation();
				prev();
				return false;
			});


			/**
			* Event handler for click on right-nav
			*/
			$controlsRight.on('click', function(e) {
				e.stopPropagation();
				next();
				return false;
			});


			/**
			* Declare variables for touch and drag event handlers
			*/
			var mouseDown = false,
				mouseMove = false,
				mouseStart = 0,
				mouseX = 0,
				touchStartY = 0,
				touchStartX = 0;

			$wrapper.on({
				/**
				* Event handler for mouse-on-click
				*/
				'mousedown': function(e) {
					mouseDown = true;
					if (ie) {
						mouseStart = event.clientX + document.body.scrollLeft;
					} else {
						mouseStart = e.pageX;
					}
				},

				/**
				* Event handler for mouse-off-click
				*/
				'mouseup': function(e) {
					if (!mouseMove) {
						return;
					}
					mouseDown = false;
					mouseMove = false;
					if (mouseStart > mouseX+20) {
						next();
					} else if (mouseStart < mouseX-20) {
						prev();
					}
				},

				/**
				* Event handler for mouse-movement
				*/
				'mousemove': function(e) {
					if (!mouseDown) return;
					mouseMove = true;
					if (ie) {
						mouseX = event.clientX + document.body.scrollLeft;
					} else {
						mouseX = e.pageX;
					}
				},

				/**
				* Event handler for beginning of touch
				*/
				'touchstart': function(e) {
					touchStartY = e.originalEvent.touches[0].clientY;
					touchStartX = e.originalEvent.touches[0].clientX;
				},

				/**
				* Event handler for end of touch
				*/
				'touchend': function(e) {
					var touchEndY = e.originalEvent.changedTouches[0].clientY,
						touchEndX = e.originalEvent.changedTouches[0].clientX,
						yDiff = touchStartY - touchEndY,
						xDiff = touchStartX - touchEndX;
					if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
				        if ( xDiff > 5 ) {
				            next();
				        } else {
				            prev();
				        }                       
				    }
					touchStartY = null;
					touchStartX = null;
				},

				/**
				* Event handler for touch movement
				*/
				'touchmove': function(e) {
					if(e.preventDefault) { e.preventDefault(); }
				}
			});


			/**
			* Update dimensions on resize
			*/
			$window.resize(function() {
				if (!config.fading) {
					$slideWrap.css({
						'width': calcWidth()+'px'
					});
					moveTo($current.index());
				}
			});


			/**
			* Declare all sub-options
			*/
			$.fn.jcider.moveTo = moveTo;
			$.fn.jcider.moveRight = next;
			$.fn.jcider.moveLeft = prev;
			$.fn.jcider.play = play;
			$.fn.jcider.pause = stopPlay;
			$.fn.jcider.togglePlay = togglePlay;
			$.fn.jcider.hidePagination = hidePagination;
			$.fn.jcider.showPagination = showPagination;
			$.fn.jcider.togglePagination = togglePagination;
			$.fn.jcider.hideControls = hideControls;
			$.fn.jcider.showControls = showControls;
			$.fn.jcider.toggleControls = toggleControls;

		});

	};

})(jQuery);
