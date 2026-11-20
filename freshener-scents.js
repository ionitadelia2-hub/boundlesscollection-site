// Aromele disponibile din foaia „parfumuri” a catalogului atelierului.
const FRAGRANCES = [
  {
    "id": "spiced-orange",
    "label": "Spiced Orange"
  },
  {
    "id": "apple-candy",
    "label": "Apple Candy"
  },
  {
    "id": "bujor",
    "label": "Bujor"
  },
  {
    "id": "orhidee-neagra",
    "label": "Orhidee Neagră"
  },
  {
    "id": "la-vie-est-belle",
    "label": "La Vie Est Belle"
  },
  {
    "id": "gingerbread-caramel-mousse",
    "label": "Gingerbread Caramel Mousse"
  },
  {
    "id": "hazelnut-cappuccino",
    "label": "Hazelnut Cappuccino"
  },
  {
    "id": "fruit-harmony",
    "label": "Fruit Harmony"
  },
  {
    "id": "musk-sandalwood",
    "label": "Musk & Sandalwood"
  },
  {
    "id": "jasmine-v2",
    "label": "Jasmine V2"
  },
  {
    "id": "frankincense-myrrh",
    "label": "Frankincense & Myrrh"
  },
  {
    "id": "black-cherry",
    "label": "Black Cherry"
  },
  {
    "id": "strawberry-slush",
    "label": "Strawberry Slush"
  },
  {
    "id": "coffee-mocha",
    "label": "Coffee Mocha"
  },
  {
    "id": "spiced-winter-punch",
    "label": "Spiced Winter Punch"
  },
  {
    "id": "english-pear-freesia",
    "label": "English Pear & Freesia"
  },
  {
    "id": "cinnamon-apple-v2",
    "label": "Cinnamon & Apple V2"
  },
  {
    "id": "spanish-jasmine",
    "label": "Spanish Jasmine"
  },
  {
    "id": "cherry-blossom",
    "label": "Cherry Blossom"
  },
  {
    "id": "lime-basil-mandarine",
    "label": "Lime & Basil & Mandarine"
  },
  {
    "id": "cocoa-patchouli",
    "label": "Cocoa & Patchouli"
  },
  {
    "id": "spiced-caramel-v2",
    "label": "Spiced Caramel V2"
  },
  {
    "id": "tropicana",
    "label": "Tropicana"
  },
  {
    "id": "lavender-v2",
    "label": "Lavender V2"
  },
  {
    "id": "lavender-chamomile-vanilla",
    "label": "Lavender & Chamomile & Vanilla"
  }
];
function isFreshener(product) {
  return Boolean(product && (/odorizant/i.test(product.title || '') || /^odorizant-dulap-/.test(product.id || '')));
}
function findFragrance(id) {
  return FRAGRANCES.find(fragrance => fragrance.id === id);
}
module.exports = { FRAGRANCES, isFreshener, findFragrance };
