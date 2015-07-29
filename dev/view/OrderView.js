/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 15:15
 */


this.setOrder = function(orderFunction, keyFunction){ // Tested
  var newProbesOrder;

  newProbesOrder = new net.webrobotics.TreeMap(orderFunction, {allowDuplicateKeys: false, suppressDuplicateKeyAlerts: true});

  this.drawnProbes.forEach(function(probe){
    newProbesOrder.put(keyFunction(probe), probe); // Set the new order
  });

  this.drawnProbesOrdered = newProbesOrder; // Overwrite previous order
  this._drawNewOrder();
};


this._drawNewOrder = function(){
  this.drawnProbesOrdered.forEach(function(probe){
    probe.dom.appendTo(dom.main);
  });
};




this._moveProbe = function(probe, newPosition){ // To finish
  var position;
  position = 0;

  function positionFunction(tmpProbe){
    if (tmpProbe.id == probe.id){
      return newPosition;
    }

    if (newPosition == position){
      position++;
    }
    position++;

    return position;
  }

  this.drawnProbesOrdered.forEach(function(probe){

  });
};