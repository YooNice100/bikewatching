   // Set your Mapbox access token here
   mapboxgl.accessToken = 'pk.eyJ1IjoieW9vbmljZTEwMCIsImEiOiJjbTdkcXIwenIwNmNmMnNxM3BmaGZpcnBwIn0.VfbP7fAIoCExozcpieP13Q';

   // Initialize the map
   const map = new mapboxgl.Map({
     container: 'map', // ID of the div where the map will render
     style: 'mapbox://styles/mapbox/streets-v12', // Map style
     center: [-71.0967349, 42.360091], // [longitude, latitude]
     zoom: 12, // Initial zoom level
     minZoom: 5, // Minimum allowed zoom
     maxZoom: 18 // Maximum allowed zoom
   });


   const svg = d3.select('#map').select('svg');
   let stations = [];
   let circles;
   let trips;


   function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
    const { x, y } = map.project(point);  // Project to pixel coordinates
    return { cx: x, cy: y };  // Return as object for use in SVG attributes
  }

    // Function to update circle positions when the map moves/zooms
    function updatePositions() {
        circles
          .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
          .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
      }
  
    //   updatePositions();

   map.on('load', () => { 
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

    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    d3.json(jsonurl).then(jsonData => {
        stations = jsonData.data.stations;
        console.log('Stations Array:', stations);


        console.log('Loaded JSON Data:', jsonData);  // Log to verify structure'
        


        circles = svg.selectAll('circle')
          .data(stations)
          .enter()
          .append('circle')
          .attr('r', 5)               // Radius of the circle
          .attr('fill', 'steelblue')  // Circle fill color
          .attr('stroke', 'white')    // Circle border color
          .attr('stroke-width', 1)    // Circle border thickness
         .attr('opacity', 0.8);      // Circle opacity

        //  console.log('Projected positions:', stations.map(s => getCoords(s)));

         // Initial position update when map loads
        updatePositions();
        
        // Reposition markers on map interactions
        map.on('move', updatePositions);     // Update during map movement
        map.on('zoom', updatePositions);     // Update during zooming
        map.on('resize', updatePositions);   // Update on window resize
        map.on('moveend', updatePositions);  // Final adjustment after movement ends



        


      }).catch(error => {
        console.error('Error loading JSON:', error);  // Handle errors if JSON loading fails


      });



      const csvurl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';
      d3.csv(csvurl).then(csvData => {
        // console.log('stations', stations)
        console.log('Loaded Traffic Data:', csvData);  
        trips = csvData;

    
        // trips = csvData.map(d => ({
        //     start_station_id: d.start_station_id,
        //     end_station_id: d.end_station_id
        // }));
        // console.log(trips.find(t => t.start_station_id === 'T32001'))
        for (let trip of trips) {
            trip.started_at = new Date(trip.started_at)
            trip.ended_at = new Date(trip.ended_at)
        }

        let departures = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.start_station_id.trim()
          );

        let arrivals = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.end_station_id.trim()
          );

        //   console.log('Stations before updating:', stations);
        //   console.log('Example Station ID:', stations[0]?.short_name);

       

        stations = stations.map((station) => {
            let id = station.short_name.trim();
            // console.log(`Station ID: ${id}, Departures: ${departures.get(id) || 'Not Found'}, Arrivals: ${arrivals.get(id) || 'Not Found'}`);
            // console.log(`Checking Station: ${id}`);
    // console.log(`Departures for ${id}:`, departures.get(id));
    // console.log(`Arrivals for ${id}:`, arrivals.get(id));
            station.arrivals = arrivals.get(id) ?? 0;
            // TODO departures
            station.departures = departures.get(id) ?? 0;
            // TODO totalTraffic
            station.totalTraffic = station.arrivals + station.departures;
            // console.log(`Total Traffic for ${id}:`, station.totalTraffic);
            // console.log(`Updated ${id}: Departures=${station.departures}, Arrivals=${station.arrivals}, Total=${station.totalTraffic}`);
            return station;
            // console.log('Updated Stations:', stations);
          });
        //   console.log('Updated Stations:', stations);
        console.log("Sample Updated Stations:", stations.slice(0, 10).map(s => ({
            id: s.short_name,
            departures: s.departures,
            arrivals: s.arrivals,
            totalTraffic: s.totalTraffic
        })));
        // console.log("First Station Directly:", stations[0]);
        // stations.forEach((s, index) => {
        //     if (index < 10) {
        //         console.log(`Station ${s.short_name}: Departures=${s.departures}, Arrivals=${s.arrivals}, Total=${s.totalTraffic}`);
        //     }
        // });




      }).catch(error => {
        console.error('Error loading CSV:', error); 
      });    




  });