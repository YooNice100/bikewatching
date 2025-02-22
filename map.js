// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoieW9vbmljZTEwMCIsImEiOiJjbTdkcXIwenIwNmNmMnNxM3BmaGZpcnBwIn0.VfbP7fAIoCExozcpieP13Q';


// document.getElementById('map').innerHTML = ''; // Clears any existing content
// console.log('Initializing Mapbox map');
// Initialize the map
console.log("Before initialization, Current Map Instance:", window.map);

const map = new mapboxgl.Map({
  container: 'map', // ID of the div where the map will render
  style: 'mapbox://styles/mapbox/streets-v12', // Map style
  center: [-71.0967349, 42.360091], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18 // Maximum allowed zoom
});
console.log("After initialization, Current Map Instance:", window.map);



const svg = d3.select('#map').select('svg');
if (svg.empty()) {
  d3.select('#map').append('svg');
}
// let stations = [];
let circles;
let trips;


function getCoords(station) {
const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
const { x, y } = map.project(point);  // Project to pixel coordinates
return { cx: x, cy: y };  // Return as object for use in SVG attributes
}




function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(minutes) {
  const date = new Date(0, 0, 0, 0, minutes);  // Set hours & minutes
  return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
}



// function computeStationTraffic(stations, trips) {
//   // Compute departures
//   const departures = d3.rollup(
//       trips, 
//       (v) => v.length, 
//       (d) => d.start_station_id
//   );
//   const arrivals = d3.rollup(
//     trips,
//     (v) => v.length,
//     (d) => d.end_station_id
//   );

//   return stations.map((station) => {
//     let id = station.short_name;
//     station.arrivals = arrivals.get(id) ?? 0;
//     station.departures = departures.get(id) ?? 0;
//     station.totalTraffic = station.arrivals + station.departures;
//     return station;
// });
// }

function updatePositions() {
  circles
    .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
    .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
  }



// function filterTripsbyTime(trips, timeFilter) {
//   return timeFilter === -1 
//     ? trips // If no filter is applied (-1), return all trips
//     : trips.filter((trip) => {
//         // Convert trip start and end times to minutes since midnight
//         const startedMinutes = minutesSinceMidnight(trip.started_at);
//         const endedMinutes = minutesSinceMidnight(trip.ended_at);
        
//         // Include trips that started or ended within 60 minutes of the selected time
//         return (
//           Math.abs(startedMinutes - timeFilter) <= 60 ||
//           Math.abs(endedMinutes - timeFilter) <= 60
//         );
//     });
// }
// function filterByMinute(tripsByMinute, minute) {
//   if (minute === -1) {
//     return tripsByMinute.flat(); // No filtering, return all trips
//   }

//   // Normalize both min and max minutes to the valid range [0, 1439]
//   let minMinute = (minute - 60 + 1440) % 1440;
//   let maxMinute = (minute + 60) % 1440;

//   // Handle time filtering across midnight
//   if (minMinute > maxMinute) {
//     let beforeMidnight = tripsByMinute.slice(minMinute);
//     let afterMidnight = tripsByMinute.slice(0, maxMinute);
//     return beforeMidnight.concat(afterMidnight).flat();
//   } else {
//     return tripsByMinute.slice(minMinute, maxMinute).flat();
//   }
// }

map.on('load', () => { 
  // console.log("Map loaded, adding source and layer...");

map.addSource('boston_route', {
    type: 'geojson',
    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
  });

map.addSource('cambridge_route', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
  });

map.addLayer({
    id: 'bike-lanes1',
    type: 'line',
    source: 'boston_route',
    paint: {
        'line-color': '#32D400',  // A bright green using hex code
        'line-width': 5,          // Thicker lines
        'line-opacity': 0.6       // Slightly less transparent
      }
  });

map.addLayer({
    id: 'bike-lanes2',
    type: 'line',
    source: 'cambridge_route',
    paint: {
        'line-color': '#32D400',  // A bright green using hex code
        'line-width': 5,          // Thicker lines
        'line-opacity': 0.6       // Slightly less transparent
      }
  });


let departuresByMinute = Array.from({ length: 1440 }, () => []);
let arrivalsByMinute = Array.from({ length: 1440 }, () => []);

const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
const csvurl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';

Promise.all([d3.json(jsonurl), d3.csv(csvurl, (trip) => {
  trip.started_at = new Date(trip.started_at);
  trip.ended_at = new Date(trip.ended_at);
  return trip;
})]).then(([jsonData, trips])=>{

  trips.forEach(trip => {
    let startedMinutes = minutesSinceMidnight(trip.started_at); 
    let endedMinutes = minutesSinceMidnight(trip.ended_at)
    // if (!departuresByMinute[startedMinutes]) {
    //   console.error(`departuresByMinute[${startedMinutes}] is undefined!`);
    // }
    // if (!arrivalsByMinute[endedMinutes]) {
    //   console.error(`arrivalsByMinute[${endedMinutes}] is undefined!`);
    // }

    departuresByMinute[startedMinutes].push(trip); 
    arrivalsByMinute[endedMinutes].push(trip);
  })
  // console.log("Sample tripsByMinute:", tripsByMinute.slice(0, 5));

  // console.log("Sample trips:", trips.slice(0, 5));


  // const stations = computeStationTraffic(jsonData.data.stations, trips);
  const stations = computeStationTraffic(jsonData.data.stations);
  // console.log('Loaded Stations', stations);


  const radiusScale = d3
    .scaleSqrt()
    .domain([0, d3.max(stations, (d) => d.totalTraffic)])
    .range([0, 25]);


  circles = svg.selectAll('circle')
    .data(stations, (d) => d.shortname)
    .enter()
    .append('circle')
    .attr('r', (d) => radiusScale(d.totalTraffic))
    .attr('fill', 'steelblue')  // Circle fill color
    .attr('stroke', 'white')    // Circle border color
    .attr('stroke-width', 1)    // Circle border thickness
    .attr('opacity', 0.6)
    .each(function(d) {
      d3.select(this)
      .append('title')
      .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
    })


    function filterByMinute(tripsByMinute, minute) {
      if (minute === -1) {
        return tripsByMinute.flat(); // No filtering, return all trips
      }
      
      // Normalize both min and max minutes to the valid range [0, 1439]
      let minMinute = (minute - 60 + 1440) % 1440;
      let maxMinute = (minute + 60) % 1440;
    
      // Handle time filtering across midnight
      if (minMinute > maxMinute) {
        let beforeMidnight = tripsByMinute.slice(minMinute);
        let afterMidnight = tripsByMinute.slice(0, maxMinute);
        return beforeMidnight.concat(afterMidnight).flat();
      } else {
        return tripsByMinute.slice(minMinute, maxMinute).flat();
      }
    }
    


    function computeStationTraffic(stations, timeFilter = -1) {
      // Retrieve filtered trips efficiently
    
      const departures = d3.rollup(
        filterByMinute(departuresByMinute, timeFilter), // Efficient retrieval
        (v) => v.length,
        (d) => d.start_station_id
      );
    
      const arrivals = d3.rollup(
        filterByMinute(arrivalsByMinute, timeFilter), // Efficient retrieval
        (v) => v.length,
        (d) => d.end_station_id
      );
      // console.log("Departures Rollup:", departures);
      // console.log("Arrivals Rollup:", arrivals);
      // console.log("Departures (Filtered):", filterByMinute(departuresByMinute, timeFilter));
      // console.log("Arrivals (Filtered):", filterByMinute(arrivalsByMinute, timeFilter));
      
    
      // Update station data with filtered counts
      return stations.map((station) => {
        let id = station.short_name;
        let departuresCount = departures.get(id) ?? 0;
        let arrivalsCount = arrivals.get(id) ?? 0;
        // console.log(`Station: ${id}, Departures: ${departuresCount}, Arrivals: ${arrivalsCount}, Total: ${departuresCount + arrivalsCount}`);
        return{
          ...station,
          
          departures: departuresCount,
          arrivals: arrivalsCount,
          totalTraffic: (departuresCount + arrivalsCount)
        }
      });
    }




    // function computeStationTraffic(stations, trips) {
    //   // Compute departures
    //   const departures = d3.rollup(
    //       trips, 
    //       (v) => v.length, 
    //       (d) => d.start_station_id
    //   );
    //   const arrivals = d3.rollup(
    //     trips,
    //     (v) => v.length,
    //     (d) => d.end_station_id
    //   );
    
    //   return stations.map((station) => {
    //     let id = station.short_name;
    //     station.arrivals = arrivals.get(id) ?? 0;
    //     station.departures = departures.get(id) ?? 0;
    //     station.totalTraffic = station.arrivals + station.departures;
    //     return station;
    // });
    // }
    

  const timeSlider = document.getElementById('time-slider');
  const selectedTime = document.getElementById('selected-time');
  const anyTimeLabel = document.getElementById('any-time');


  function updateTimeDisplay() {
    let timeFilter = Number(timeSlider.value); // Get slider value

    if (timeFilter === -1) {
      selectedTime.textContent = ''; // Clear time display
      anyTimeLabel.style.display = 'block'; // Show "(any time)"
    } else {
      selectedTime.textContent = formatTime(timeFilter); // Display formatted time
      anyTimeLabel.style.display = 'none'; // Hide "(any time)"
    }
    
    // Call updateScatterPlot to reflect the changes on the map
    updateScatterPlot(timeFilter);
}

  timeSlider.addEventListener('input', updateTimeDisplay);
  updateTimeDisplay();




  function updateScatterPlot(timeFilter) {
    // Get only the trips that match the selected time filter
    // const filteredTrips = filterTripsbyTime(trips, timeFilter);
    
    // Recompute station traffic based on the filtered trips
    // const filteredStations = computeStationTraffic(stations, filteredTrips);

    const filteredStations = computeStationTraffic(stations, timeFilter);
    timeFilter === -1 ? radiusScale.range([0, 25]) : radiusScale.range([3, 50]);

    circles = svg.selectAll('circle')
      .data(filteredStations, (d) => d.shortname)
      .join('circle')
      .attr('r', (d) => radiusScale(d.totalTraffic))
      .attr('fill', 'steelblue')  // Circle fill color
      .attr('stroke', 'white')    // Circle border color
      .attr('stroke-width', 1)    // Circle border thickness
      .attr('opacity', 0.6)
      .each(function(d) {
        d3.select(this)
        .append('title')
        .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
      })
      

      updatePositions();
  }


  // Reposition markers on map interactions
  map.on('move', updatePositions);     // Update during map movement
  map.on('zoom', updatePositions);     // Update during zooming
  map.on('resize', updatePositions);   // Update on window resize
  map.on('moveend', updatePositions);  // Final adjustment after movement ends




}).catch(error => {
  console.error('Error loading data:', error);  // Handle errors if JSON loading fails
});

  });