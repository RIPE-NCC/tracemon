/**
 * Copyright 2014 - mcandela
 * Date: 26/11/14
 * Time: 14:38
 */

var CutOutelierGlobalFilter = function(){

  this.manipulate = function(data){
    var dataOut, minOfArray, item, sortedData, medianPosition, medianValue;

    sortedData = data.sort();

    medianPosition = (sortedData.length / 100) * 75;

    if (sortedData.length % 2 == 0) {
      medianValue = sortedData[medianPosition];
    } else {
      medianValue = (sortedData[Math.floor(medianPosition)] + sortedData[Math.ceil(medianPosition)]) / 2;
    }


    for (var n=0,length=data.length; n<length; n++){
      item = data[n];
      if (item.min){
        minOfArray = Math.min(item.min, minOfArray);
      }
    }

    return dataOut;
  };


};