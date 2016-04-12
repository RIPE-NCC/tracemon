/**
 * Some path configurations
 */

TRACEMON_WIDGET_URL = ((typeof TRACEMON_EXTERNAL_WIDGET_URL == 'undefined') ? "https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/latencymon/" : TRACEMON_EXTERNAL_WIDGET_URL) ;

TRACEMON_ENVIRONMENT_URL = TRACEMON_WIDGET_URL + "dev/environment/";

TRACEMON_LIB_URL = TRACEMON_WIDGET_URL + "dev/libs/";
TRACEMON_CONNECTOR_URL = TRACEMON_WIDGET_URL + "dev/connector/";

TRACEMON_MODEL_URL = TRACEMON_WIDGET_URL + "dev/model/";
TRACEMON_VIEW_URL = TRACEMON_WIDGET_URL + "dev/view/";
TRACEMON_CONTROLLER_URL = TRACEMON_WIDGET_URL + "dev/controller/";
TRACEMON_FILTER_URL = TRACEMON_WIDGET_URL + "dev/filter/";

TRACEMON_SESSION_URL = TRACEMON_WIDGET_URL + "dev/session/";
TRACEMON_CONFIG_URL = TRACEMON_WIDGET_URL + "dev/";
TRACEMON_UTIL_URL = TRACEMON_WIDGET_URL + "dev/";

TRACEMON_MAIN_URL = TRACEMON_WIDGET_URL;


TRACEMON_INSTANCES = [];
TRACEMON_RUNNING_INSTANCES = {};
TRACEMON_INSTANCE_CALLBACKS = {};

document.write('<script src="' + TRACEMON_LIB_URL + 'require.min.js"></script>');


/**
 * This is the code of the widget system
 */

function getTracemonInstance(){
    return TRACEMON_INSTANCES.shift();
}

function getTracemon(domElement, params){
    var instance = TRACEMON_RUNNING_INSTANCES[domElement];
    instance.setParams(params);
}

function initTracemon(domElement, instanceParams, queryParams){
    var runTracemon;

    TRACEMON_INSTANCES.push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    runTracemon = function (Tracemon) {
        var instance;

        instance = getTracemonInstance();
        TRACEMON_RUNNING_INSTANCES[domElement] = Tracemon(instance);
    };


    if (!instanceParams.dev) {

        require([TRACEMON_WIDGET_URL + 'tracemon-dist.js'], function () {
            require(['tracemon-loader'], runTracemon);
        });

    } else {

        require([TRACEMON_WIDGET_URL + 'tracemon-loader.js'], runTracemon);

    }


    return {
        shell: function(){
            if (TRACEMON_RUNNING_INSTANCES[domElement]) {
                return TRACEMON_RUNNING_INSTANCES[domElement];
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        }
    };
}
