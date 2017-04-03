/* ===========================================================
 * Minimal extension to bootstrap-popover.js v2.0.0
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * I claim nothing, just hope this helps someone else.
 */


!function( $ ) {

    "use strict"

    var CirclePopover = function ( element, options ) {
        this.init('cpopover', element, options)
    }

    /* NOTE: CPOPOVER EXTENDS BOOTSTRAP-POPOVER.js and by extension 
     * BOOTSTRAP-TOOLTIP.js
     ========================================== */

    CirclePopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

        constructor: CirclePopover
        , getPosition: function (inside) {
            var diameter =  this.$element[0].r.baseVal.value * 2;
            return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
                width: diameter
                , height: diameter
            })
        }
    })


    /* POPOVER PLUGIN DEFINITION
     * ======================= */

    $.fn.cpopover = function ( option ) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('cpopover')
                , options = typeof option == 'object' && option
            if (!data) $this.data('cpopover', (data = new CirclePopover(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.cpopover.Constructor = CirclePopover

    $.fn.cpopover.defaults = $.extend({} , $.fn.popover.defaults, {})

}( window.jQuery )