// /* eslint-disable */
// export const displayMap = (locations) => {
//   mapboxgl.accessToken =
//     'pk.eyJ1Ijoiam9uYXNzY2htZWR0bWFubiIsImEiOiJjam54ZmM5N3gwNjAzM3dtZDNxYTVlMnd2In0.ytpI7V7w7cyT1Kq5rT9Z1A';
//
//   var map = new mapboxgl.Map({
//     // container: an element with the ID of 'map' and it puts it there.
//     container: 'map',
//     style: 'mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy',
//     scrollZoom: false,
//     // center: [-118.113491, 34.111745],
//     // zoom: 10,
//     // interactive: false
//   });
//
//   const bounds = new mapboxgl.LngLatBounds();
//
//   locations.forEach((loc) => {
//     // Create marker in HTML
//     const el = document.createElement('div');
//     el.className = 'marker';
//
//     // Add marker into the mapbox
//     new mapboxgl.Marker({
//       // selecting HTML element of our marker
//       element: el,
//       // Bottom of the element (pin) will be on the location.
//       anchor: 'bottom',
//     })
//       //setting position of the marker
//       .setLngLat(loc.coordinates)
//       // add it to our map element that we created above
//       .addTo(map);
//
//     // Add popup to describe each location
//     new mapboxgl.Popup({
//       offset: 30,
//     })
//       .setLngLat(loc.coordinates)
//       // Adding more html to the map.
//       .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
//       .addTo(map);
//
//     // Extend map bounds to include current location
//     bounds.extend(loc.coordinates);
//   });
//
//   // fitBound method moves and zooms the map based on our locations that we got from DB.
//   // The {} passed to the method is for design
//   map.fitBounds(bounds, {
//     padding: {
//       top: 200,
//       bottom: 150,
//       left: 100,
//       right: 100,
//     },
//   });
// };
