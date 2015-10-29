/**
 * Some path configurations
 */

LATENCYMON_WIDGET_URL = ((typeof LATENCYMON_EXTERNAL_WIDGET_URL == 'undefined') ? "https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/latencymon/" : LATENCYMON_EXTERNAL_WIDGET_URL) ;

LATENCYMON_ENVIRONMENT_URL = LATENCYMON_WIDGET_URL + "dev/environment/";

LATENCYMON_LIB_URL = LATENCYMON_WIDGET_URL + "dev/libs/";
LATENCYMON_CONNECTOR_URL = LATENCYMON_WIDGET_URL + "dev/connector/";

LATENCYMON_MODEL_URL = LATENCYMON_WIDGET_URL + "dev/model/";
LATENCYMON_VIEW_URL = LATENCYMON_WIDGET_URL + "dev/view/";
LATENCYMON_CONTROLLER_URL = LATENCYMON_WIDGET_URL + "dev/controller/";
LATENCYMON_FILTER_URL = LATENCYMON_WIDGET_URL + "dev/filter/";

LATENCYMON_SESSION_URL = LATENCYMON_WIDGET_URL + "dev/session/";
LATENCYMON_CONFIG_URL = LATENCYMON_WIDGET_URL + "dev/";
LATENCYMON_UTIL_URL = LATENCYMON_WIDGET_URL + "dev/";

LATENCYMON_MAIN_URL = LATENCYMON_WIDGET_URL;


LATENCYMON_INSTANCES = [];
LATENCYMON_RUNNING_INSTANCES = {};
LATENCYMON_INSTANCE_CALLBACKS = {};

document.write('<script src="' + LATENCYMON_LIB_URL + 'require.min.js"></script>');


/**
 * This is the code of the widget system
 */

function getLatencymonInstance(){
    return LATENCYMON_INSTANCES.shift();
}

function getLatencymon(domElement, params){
    var instance = LATENCYMON_RUNNING_INSTANCES[domElement];
    instance.setParams(params);
}

function initLatencymon(domElement, instanceParams, queryParams){
    var runLatencymon;

    LATENCYMON_INSTANCES.push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    runLatencymon = function (Latencymon) {
        var instance;

        instance = getLatencymonInstance();
        LATENCYMON_RUNNING_INSTANCES[domElement] = Latencymon(instance);
    };


    if (!instanceParams.dev) {

        require([LATENCYMON_WIDGET_URL + 'latencymon-dist.js'], function () {
            require(['latencymon-loader'], runLatencymon);
        });

    } else {

        require([LATENCYMON_WIDGET_URL + 'latencymon-loader.js'], runLatencymon);

    }


    return {
        shell: function(){
            if (LATENCYMON_RUNNING_INSTANCES[domElement]) {
                return LATENCYMON_RUNNING_INSTANCES[domElement];
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        }
    };
}
