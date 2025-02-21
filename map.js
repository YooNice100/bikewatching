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

