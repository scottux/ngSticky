(function () {
	'use strict';

	var module = angular.module('sticky', []);

	// Directive: sticky
	//
	module.directive('sticky', function() {
		return {
			restrict: 'A', // this directive can only be used as an attribute.
			link: linkFn
		};

		function linkFn($scope, $elem, $attrs) {
			var mediaQuery, stickyClass, bodyClass, elem, $window, $body,
				doc, initialCSS, initialStyle, /*isPositionFixed,*/ isSticking,
				stickyLine, offset, anchor, prevOffset, matchMedia, usePlaceholder, placeholder;

			//isPositionFixed = false;
			isSticking      = false;

			matchMedia      = window.matchMedia;

			// elements
			$window = angular.element(window);
			$body   = angular.element(document.body);
			elem    = $elem[0];
			doc     = document.documentElement;

			// attributes
			mediaQuery  = $attrs.mediaQuery  || false;
			stickyClass = $attrs.stickyClass || '';
			bodyClass   = $attrs.bodyClass   || '';

			initialStyle = $elem.attr('style');

			offset = typeof $attrs.offset === 'string' ? 
				parseInt($attrs.offset.replace(/px;?/, '')) : 
				0;

			anchor = typeof $attrs.anchor === 'string' ? 
				$attrs.anchor.toLowerCase().trim() 
				: 'top';

            usePlaceholder = angular.isDefined($attrs.useplaceholder);

			// initial style
			initialCSS = {
				top:       $elem.css('top'),
				width:     $elem.css('width'),
				position:  $elem.css('position'),
				marginTop: $elem.css('margin-top'),
				cssLeft:   $elem.css('left')
			};

			switch (anchor) {
				case 'top':
				case 'bottom':
					break;
				default:
					//console.log('Unknown anchor '+anchor+', defaulting to top');
					anchor = 'top';
					break;
			}


			// Listeners
			//
			$window.on('scroll',  checkIfShouldStick);
			$window.on('resize',  $scope.$apply.bind($scope, onResize));
			$scope.$on('$destroy', onDestroy);

			function onResize() {
                var parent,initialOffsetWidth;
				initialCSS.offsetWidth = elem.offsetWidth;
                unstickElement();
				checkIfShouldStick();
				
				if (isSticking) {
					parent = window.getComputedStyle(elem.parentElement, null);
					initialOffsetWidth = elem.parentElement.offsetWidth -
							parent.getPropertyValue('padding-right').replace('px', '') - 
							parent.getPropertyValue('padding-left').replace('px', '');

					$elem.css('width', initialOffsetWidth+'px');
				}
			}

			function onDestroy() {
				$window.off('scroll', checkIfShouldStick);
				$window.off('resize', onResize);
				
				if ( bodyClass ) {
					$body.removeClass(bodyClass);
				}
                if ( placeholder ) {
                    placeholder.remove();
                }
			}


			// Watcher
			//
			prevOffset = _getTopOffset(placeholder || elem);

            //console.log(prevOffset);

			$scope.$watch( function() { // triggered on load and on digest cycle
				if ( isSticking ) {
                    return prevOffset || _getTopOffset(placeholder);
                }

				prevOffset = 
					(anchor === 'top') ? 
						_getTopOffset(elem) :
						_getBottomOffset(elem);

				return prevOffset;

			}, function(newVal, oldVal) {
                //console.log("watcher",newVal,oldVal);
				if ( newVal !== oldVal || angular.isDefined(stickyLine) ) {
					stickyLine = newVal - offset;
                    if (stickyLine < 0) {
                        stickyLine = 0;
                    }
					checkIfShouldStick();
				}
			});


			// Methods
			//
			function checkIfShouldStick() {
				var scrollTop, shouldStick, scrollBottom, scrolledDistance;

				if ( (mediaQuery && !matchMedia('('+mediaQuery+')').matches) ) {
                    if ( isSticking ) {
                        unstickElement();
                    }
                    return;
                }
				if ( anchor === 'top' ) {
					scrolledDistance = window.pageYOffset || doc.scrollTop;
					scrollTop        = scrolledDistance  - (doc.clientTop || 0) - offset;
					shouldStick      = scrollTop >= stickyLine;
                    //console.log("should stick:",scrollTop,stickyLine,shouldStick);
				} else {
					scrollBottom     = window.pageYOffset + window.innerHeight;
					shouldStick      = scrollBottom <= stickyLine;
				}

				// Switch the sticky mode if the element crosses the sticky line
				if ( shouldStick && !isSticking ) {
					stickElement();
				} else if ( !shouldStick && isSticking ) {
					unstickElement();
                }
			}

			function stickElement() {
				var rect, absoluteLeft;
                var elementHeight;

				rect = elem.getBoundingClientRect();
				absoluteLeft = rect.left;

				initialCSS.offsetWidth = elem.offsetWidth;

				isSticking = true;

				if ( bodyClass ) {
					$body.addClass(bodyClass);
				}

				if ( stickyClass ) {
					$elem.addClass(stickyClass);
				}

				$elem
					.css('width',      elem.offsetWidth+'px')
					.css('position',   'fixed')
					.css(anchor,       offset+'px')
					.css('left',       absoluteLeft)
					.css('margin-top', 0);

				if ( anchor === 'bottom' ) {
					$elem.css('margin-bottom', 0);
				}

                //create placeholder to avoid jump
                if( usePlaceholder ) {
                    placeholder = angular.element("<div>");
                    elementHeight = $elem.height();
                    placeholder.css("height", elementHeight + "px");
                    $elem.after(placeholder);
                }
			}

			function unstickElement() {
				$elem.attr('style', initialStyle); // restore inline style attribute value

				isSticking = false;

				if ( bodyClass ) {
					$body.removeClass(bodyClass);
				}

				if ( stickyClass ) {
					$elem.removeClass(stickyClass);
				}

				$elem
					.css('width',      '')
					.css('top',        initialCSS.top)
					.css('position',   initialCSS.position)
					.css('left',       initialCSS.cssLeft)
					.css('margin-top', initialCSS.marginTop);

                if ( placeholder ) {
                    placeholder.remove();
                }
			}

			function _getTopOffset (element) {
				var pixels = 0;

				if (element.offsetParent) {
                    //console.log("calculating top position", element.offsetTop, element.offsetParent);
					do {
						pixels += element.offsetTop;
						element = element.offsetParent;
					} while (element);
				}

				return pixels;
			}

			function _getBottomOffset (element) {
				return element.offsetTop + element.clientHeight;
			}
		}

	});

	// Shiv: matchMedia
	//
	window.matchMedia = window.matchMedia || (function() {
		var warning = 'angular-sticky: This browser does not support '+
			'matchMedia, therefore the minWidth option will not work on '+
			'this browser. Polyfill matchMedia to fix this issue.';

		if ( window.console && console.warn ) {
			console.warn(warning);
		}

		return function() {
			return {
				matches: true
			};
		};
	}());

}());
