export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY2VheGVyIiwiYSI6ImNraWZ3b2p2ejI3MGkzNG54b2J4eGEyMzQifQ.7gZRUmdZ0bHIZbdOgDXAew";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/ceaxer/ckveddr96ck0615mpkuoq1kk3",
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // CREATE MARKER
    const el = document.createElement("div");
    el.classList.add("marker");

    // ADD MARKER
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // ADD POPUP
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // EXTEND THe MAP BOUND TO ShOW THE CURRENT LOCATION
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
