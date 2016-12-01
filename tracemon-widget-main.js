/**
 * The location of the widget
 */
TRACEMON_WIDGET_URL = ((typeof TRACEMON_EXTERNAL_WIDGET_URL == 'undefined') ? "https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/tracemon/" : TRACEMON_EXTERNAL_WIDGET_URL) ;

/**
 * Name space configuration
 */
window.atlas = window.atlas || {};
window.atlas._widgets = window.atlas._widgets || {};
window.atlas._widgets.tracemon = window.atlas._widgets.tracemon || {};
window.atlas._widgets.tracemon.urls = window.atlas._widgets.tracemon.urls || {
        libs: TRACEMON_WIDGET_URL + "dev/libs/",
        env: TRACEMON_WIDGET_URL + "dev/environment/",
        connector: TRACEMON_WIDGET_URL + "dev/connector/",
        model: TRACEMON_WIDGET_URL + "dev/model/",
        view: TRACEMON_WIDGET_URL + "dev/view/",
        controller: TRACEMON_WIDGET_URL + "dev/controller/",
        session: TRACEMON_WIDGET_URL + "dev/session/"
    };
window.atlas._widgets.tracemon.instances = window.atlas._widgets.tracemon.instances || {
        requested: [],
        running: {},
        callbacks: {}
    };


if (!window.atlas._widgets.widgetInjectorRequested) { // Only one injector
    window.atlas._widgets.widgetInjectorLoaded = false;
    window.atlas._widgets.widgetInjectorRequested = true;
    window.atlas._widgets.tracemon.tmp_scripts = document.getElementsByTagName('script');
    window.atlas._widgets.tracemon.tmp_scrip = window.atlas._widgets.tracemon.tmp_scripts[window.atlas._widgets.tracemon.tmp_scripts.length - 1];
    window.atlas._widgets.injectorScript = document.createElement('script');
    window.atlas._widgets.injectorScript.async = false;
    window.atlas._widgets.injectorScript.src = window.atlas._widgets.tracemon.urls.libs + 'require.min.js';
    window.atlas._widgets.tracemon.tmp_scrip.parentNode.appendChild(window.atlas._widgets.injectorScript);
}

/**
 * Widget injector
 */
function initTracemon(domElement, instanceParams, queryParams){
    var run;

    run = function(){
        var instances, instance;

        instances = window.atlas._widgets.tracemon.instances;
        instance = instances.requested.shift();

        while (instance){
            (function(instances, instance){
                if (instance.instanceParams.dev) { // Load dev version
                    require([TRACEMON_WIDGET_URL + 'tracemon-loader.js'], function(Tracemon){
                        instances.running[instance.domElement] = Tracemon(instance);
                    });
                } else { // Load deployed version
                    require([TRACEMON_WIDGET_URL + 'tracemon-dist.js'], function () {
                        require(['tracemon-loader'], function(Tracemon){
                            instances.running[instance.domElement] = Tracemon(instance);
                        });
                    });
                }
            })(instances, instance);


            instance = instances.requested.shift();
        }
    };

    window.atlas._widgets.tracemon.instances.requested
        .push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    if (document.readyState == 'complete'){
        window.atlas._widgets.widgetInjectorLoaded = true;
    }
    if (window.atlas._widgets.widgetInjectorLoaded === false){
        window.atlas._widgets.injectorScript.onload = function(){
            window.atlas._widgets.widgetInjectorLoaded = true;
            run();
        };
    } else {
        run();
    }

    return {
        shell: function(){
            var instance = window.atlas._widgets.tracemon.instances.running[domElement];

            if (instance) {
                return instance;
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        }
    };
}
