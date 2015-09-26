(function($, window, document, undefined) {
  'use strict';
  
  var units = 'Imperial';
  var converterButton = document.getElementById('temp-converter');
  converterButton.addEventListener('click', toggleUnits, false);

  // TODO: error handling
  getPosition().then(function(data) {
    return Promise.all(
      [reverseGeolocate(data), getWeather(data)]
    );
  }).then(function(values) {
    units = getUnits(values[0]);
    appendValues(
      values[0].results[0].formatted_address, 
      values[1]);
    // fade in weather display
    fadeInBackground(values[1].main.temp);
    $('#weather-display').animate({ opacity: 1 }, 2800);
  });
  
  function getPosition() {
    return new Promise(function(resolve, reject) {
      var pos = navigator.geolocation.getCurrentPosition(
        function success(pos) { resolve(pos); },
        function error(err) { reject(err); }
      );
    });
  }

  function reverseGeolocate(data) {
    return Promise.resolve(
      $.getJSON(
        'https://maps.googleapis.com/maps/api/geocode/json?' +
        'latlng=' + data.coords.latitude +
        ', ' + data.coords.longitude +
        '&key=',
        function(geoData) {
          return geoData;
        })
    );
  };

  function getWeather(data) {
    return Promise.resolve(
      $.getJSON(
        'http://api.openweathermap.org/data/2.5/weather?' +
        'units=imperial' +
        '&lat=' + data.coords.latitude +
        '&lon=' + data.coords.longitude +
        '&APPID=',
        function(weatherData) {
          return weatherData;
        })
    );
  };

  function appendValues(addr, weatherData) {
    var tValues = temperatureValues(weatherData.main.temp);
    var wValues = windValues(weatherData.wind.speed, weatherData.wind.deg);
    var iImgB = "<img src='http://openweathermap.org/img/w/";
    var iImgE = ".png'/>";

    $('#addr').append(addr);
    $('#unitval').append(tValues[0]);
    $('#unitsign').append(tValues[1]);
    $('#weathericon').append(iImgB + weatherData.weather[0].icon + iImgE);
    $('#conditions .desc').append(weatherData.weather[0].description);
    $('#direction').append(wValues[0]);
    $('#wVal').append(wValues[1]);
    $('#wUnits').append(wValues[2]);
  };
  
  function temperatureValues(temp) {
    var tUnit = '';
    if (units === 'Imperial') 
      { tUnit = 'F'; } 
    else 
      { tUnit = 'C'; }
    
    return [numeral(temp).format('0.0'), tUnit];
  }
  
  function windValues(speed, direction) {
    var wspdunits = '';
    
    if (units === 'Imperial') 
      { wspdunits = 'MPH'; } 
    else
      { wspdunits = 'KPH'; }
    
    var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    var didx = Math.floor((direction + 11.25)/22.5)
    var dcode = dirs[didx%16];
    
    if (dcode === undefined) { dcode = ''; }
    
    return [dcode, numeral(speed).format('0.0'), wspdunits];
  }
  
  function getUnits(data) {
    var country = '';
    data.results[0].address_components.forEach(function(el) {
      if (el.types.indexOf('country') != -1) { country = el.short_name; }
    });
    
    if (country === 'US') { return 'Imperial'; }
    
    return 'Metric';
  }
  
  function toggleUnits() {
    var other = '';
    
    if (units === 'Imperial') {
      units = 'Metric';
      other = 'Imperial';
    } else {
      units = 'Imperial';
      other = 'Metric';
    }
    
    // temperature
    var t = document.getElementById('unitval').innerHTML;
    var tv = parseFloat(t);
    
    // wind
    var w = document.getElementById('wVal').innerHTML;
    var wv = parseFloat(w);
    
    // convert
    if (units === 'Metric') {
      tv = (tv - 32) * 5.0 / 9.0;
      wv *= 1.609344;      
    } else {
      tv = tv * 1.8 + 32.0;
      wv *= 0.6213711922;
    }
    
    var tValues = temperatureValues(tv);
    var wValues = windValues(wv);
    
    document.getElementById('unitval').innerHTML = tValues[0];
    document.getElementById('unitsign').innerHTML = tValues[1];
    document.getElementById('wVal').innerHTML = wValues[1];
    document.getElementById('wUnits').innerHTML = wValues[2];
    document.getElementById('temp-converter').innerHTML = other;
  }
  
  function fadeInBackground(temperature) {
    var bgArray = ['0-9.gif', '10-19.gif', '20-29.gif', '30-39.gif',
                  '40-49.gif', '50-59.gif', '60-69.gif', '70-79.gif',
                  '80-89.gif', '90-99.gif'];
    
    var bgUrl = 'https://s3-us-west-2.amazonaws.com/gmc-data/Misc/temp_images/'
    var bgOpts = 'no-repeat center center fixed';
    var bgImg = '';
    if (temperature < 0 )
      { bgImg = 'below-0.gif'; }
    else if (temperature >= 100)
      { bgImg = '100-plus.gif'; }
    else
      { bgImg = bgArray[ Math.floor(temperature/10) ]; }
      //{ bgImg = '70-79.gif'; }
    
    var bgString = 'url(' + bgUrl + bgImg + ') ' + bgOpts;
    document.body.style.background = bgString;
    document.body.style.backgroundSize = 'cover';
  }
    
})(jQuery, window, document);
