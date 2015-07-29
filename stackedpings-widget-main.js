/**
 * Some path configurations
 */

STACKEDPINGS_WIDGET_URL = ((typeof STACKEDPINGS_EXTERNAL_WIDGET_URL == 'undefined') ? "" : STACKEDPINGS_EXTERNAL_WIDGET_URL) ;

STACKEDPINGS_ENVIRONMENT_URL = STACKEDPINGS_WIDGET_URL + "dev/environment/";

STACKEDPINGS_LIB_URL = STACKEDPINGS_WIDGET_URL + "dev/libs/";
STACKEDPINGS_CONNECTOR_URL = STACKEDPINGS_WIDGET_URL + "dev/connector/";

STACKEDPINGS_MODEL_URL = STACKEDPINGS_WIDGET_URL + "dev/model/";
STACKEDPINGS_VIEW_URL = STACKEDPINGS_WIDGET_URL + "dev/view/";
STACKEDPINGS_CONTROLLER_URL = STACKEDPINGS_WIDGET_URL + "dev/controller/";
STACKEDPINGS_FILTER_URL = STACKEDPINGS_WIDGET_URL + "dev/filter/";

STACKEDPINGS_SESSION_URL = STACKEDPINGS_WIDGET_URL + "dev/session/";
STACKEDPINGS_CONFIG_URL = STACKEDPINGS_WIDGET_URL + "dev/";
STACKEDPINGS_UTIL_URL = STACKEDPINGS_WIDGET_URL + "dev/";

STACKEDPINGS_MAIN_URL = STACKEDPINGS_WIDGET_URL;


STACKEDPINGS_INSTANCES = [];
STACKEDPINGS_RUNNING_INSTANCES = {};
STACKEDPINGS_INSTANCE_CALLBACKS = {};

document.write('<script src="' + STACKEDPINGS_LIB_URL + 'require.min.js"></script>');


/**
 * This is the code of the widget system
 */

function getStackedPingsInstance(){
    return STACKEDPINGS_INSTANCES.shift();
}

function getStackedPings(domElement, params){
    var instance = STACKEDPINGS_RUNNING_INSTANCES[domElement];
    instance.setParams(params);
}

function initStackedPings(domElement, instanceParams, queryParams){
    var runStackedPings;

    STACKEDPINGS_INSTANCES.push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    runStackedPings = function (StackedPings) {
        var instance;

        instance = getStackedPingsInstance();
        STACKEDPINGS_RUNNING_INSTANCES[domElement] = StackedPings(instance);
    };


    if (!instanceParams.dev) {

        require([STACKEDPINGS_WIDGET_URL + 'stackedpings-dist.js'], function () {
            require(['stackedpings-loader'], runStackedPings);
        });

    } else {

        require([STACKEDPINGS_WIDGET_URL + 'stackedpings-loader.js'], runStackedPings);

    }


    return {
        shell: function(){
            if (STACKEDPINGS_RUNNING_INSTANCES[domElement]) {
                return STACKEDPINGS_RUNNING_INSTANCES[domElement];
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        }
    };
}
